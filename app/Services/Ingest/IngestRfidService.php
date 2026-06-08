<?php

namespace App\Services\Ingest;

use App\Jobs\EvaluateRfidRulesJob;
use App\Models\RfidReader;
use App\Models\RfidReadEvent;
use App\Models\RfidTagLastSeen;
use App\Models\WorkerRecord;
use App\Services\Rfid\SiteHeadcountService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IngestRfidService
{
    public function __construct(
        private readonly IngestTokenService $tokens,
        private readonly SiteHeadcountService $headcount,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{status: string, batch_id: string, events_accepted: int}
     */
    public function ingest(string $bearer, array $validated): array
    {
        $token = $this->tokens->findByBearer($bearer);

        if ($token === null || ! $token->isValid()) {
            throw ValidationException::withMessages(['authorization' => ['Invalid ingest token.']]);
        }

        $readerId = (int) $validated['reader_id'];
        $reader = RfidReader::query()
            ->with(['site', 'rfidZone'])
            ->findOrFail($readerId);

        if (! $this->tokens->matchesTokenable($token, $reader)) {
            throw ValidationException::withMessages(['reader_id' => ['Token is not valid for this reader.']]);
        }

        $payload = $validated['payload'];
        $batchId = (string) $payload['batch_id'];

        if (RfidReadEvent::query()->where('batch_id', $batchId)->exists()) {
            return [
                'status' => 'duplicate',
                'batch_id' => $batchId,
                'events_accepted' => 0,
            ];
        }

        return DB::transaction(function () use ($token, $reader, $payload, $batchId): array {
            $accepted = 0;

            foreach ($payload['events'] as $event) {
                $worker = WorkerRecord::query()
                    ->where('site_id', $reader->site_id)
                    ->where('tag_epc', $event['epc'])
                    ->where('is_active', true)
                    ->first();

                $readAt = $event['read_at'] ?? $payload['read_at'];

                if ($reader->isGateReader() && isset($event['direction'])) {
                    $this->headcount->recordGateEvent(
                        $reader->site,
                        $event['epc'],
                        $event['direction'],
                        $reader->id,
                        $worker,
                    );
                } elseif ($reader->isGateReader()) {
                    throw ValidationException::withMessages([
                        'payload.events' => ['Gate reader events must include direction (entry or exit).'],
                    ]);
                }

                RfidReadEvent::query()->create([
                    'site_id' => $reader->site_id,
                    'rfid_reader_id' => $reader->id,
                    'rfid_zone_id' => $reader->rfid_zone_id,
                    'tag_epc' => $event['epc'],
                    'worker_record_id' => $worker?->id,
                    'rssi' => $event['rssi'] ?? null,
                    'read_at' => $readAt,
                    'batch_id' => $batchId,
                ]);

                if (! ($reader->isGateReader() && isset($event['direction']))) {
                    $lastSeen = RfidTagLastSeen::query()->firstOrNew([
                        'site_id' => $reader->site_id,
                        'tag_epc' => $event['epc'],
                    ]);

                    $zoneChanged = $lastSeen->exists && (int) $lastSeen->rfid_zone_id !== (int) $reader->rfid_zone_id;

                    $lastSeen->fill([
                        'worker_record_id' => $worker?->id,
                        'rfid_zone_id' => $reader->rfid_zone_id,
                        'rfid_reader_id' => $reader->id,
                        'last_seen_at' => $readAt,
                        'stationary_since' => $zoneChanged ? null : ($lastSeen->stationary_since ?? $readAt),
                    ]);

                    if (! $lastSeen->exists) {
                        $lastSeen->is_on_site = false;
                    }

                    $lastSeen->save();
                }

                $accepted++;
            }

            $reader->update([
                'last_ingest_at' => now(),
                'health_status' => 'online',
            ]);

            $token->update(['last_used_at' => now()]);

            EvaluateRfidRulesJob::dispatch($reader->id, $batchId);

            return [
                'status' => 'accepted',
                'batch_id' => $batchId,
                'events_accepted' => $accepted,
            ];
        });
    }
}
