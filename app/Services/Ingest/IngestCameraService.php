<?php

namespace App\Services\Ingest;

use App\Jobs\EvaluateDetectionRulesJob;
use App\Models\Camera;
use App\Models\DetectionEvent;
use App\Models\MediaObject;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class IngestCameraService
{
    public function __construct(
        private readonly IngestTokenService $tokens,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{status: string, ingest_event_id: string, detection_count: int}
     */
    public function ingest(string $bearer, array $validated): array
    {
        $token = $this->tokens->findByBearer($bearer);

        if ($token === null || ! $token->isValid()) {
            throw ValidationException::withMessages(['authorization' => ['Invalid ingest token.']]);
        }

        $cameraId = (int) $validated['camera_id'];
        $camera = Camera::query()
            ->with(['site', 'zones' => fn ($q) => $q->where('is_active', true), 'zones.rules', 'detectionModule'])
            ->findOrFail($cameraId);

        if (! $this->tokens->matchesTokenable($token, $camera)) {
            throw ValidationException::withMessages(['camera_id' => ['Token is not valid for this camera.']]);
        }

        if (! $camera->is_active) {
            throw ValidationException::withMessages(['camera_id' => ['Camera is inactive.']]);
        }

        $payload = $validated['payload'];
        $ingestEventId = (string) $payload['event_id'];

        if (DetectionEvent::query()->where('ingest_event_id', $ingestEventId)->exists()) {
            return [
                'status' => 'duplicate',
                'ingest_event_id' => $ingestEventId,
                'detection_count' => 0,
            ];
        }

        return DB::transaction(function () use ($token, $camera, $payload, $ingestEventId): array {
            $snapshotMedia = $this->storeSnapshot($camera, $payload);

            $detectionCount = 0;
            foreach ($payload['detections'] as $index => $detection) {
                $eventId = (string) Str::uuid();
                DetectionEvent::query()->create([
                    'site_id' => $camera->site_id,
                    'camera_id' => $camera->id,
                    'detection_module_id' => $camera->detection_module_id,
                    'ingest_event_id' => $ingestEventId,
                    'event_id' => $eventId,
                    'captured_at' => $payload['captured_at'],
                    'received_at' => now(),
                    'classes' => $detection['classes'],
                    'bbox' => $detection['bbox'],
                    'zone_ids' => $this->resolveZoneIds($camera, $detection['bbox']),
                    'extras' => isset($detection['distance_m']) ? ['distance_m' => $detection['distance_m']] : null,
                    'assurance_tier' => 'inferred',
                    'snapshot_media_id' => $snapshotMedia->id,
                ]);
                $detectionCount++;
            }

            $camera->update([
                'last_ingest_at' => now(),
                'health_status' => 'online',
            ]);

            $token->update(['last_used_at' => now()]);

            EvaluateDetectionRulesJob::dispatch($camera->id, $ingestEventId);

            return [
                'status' => 'accepted',
                'ingest_event_id' => $ingestEventId,
                'detection_count' => $detectionCount,
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function storeSnapshot(Camera $camera, array $payload): MediaObject
    {
        $binary = base64_decode((string) $payload['snapshot'], true);

        if ($binary === false) {
            throw ValidationException::withMessages(['payload.snapshot' => ['Invalid base64 snapshot.']]);
        }

        $max = (int) config('siteguard.snapshot_max_bytes', 5 * 1024 * 1024);

        if (strlen($binary) > $max) {
            throw ValidationException::withMessages(['payload.snapshot' => ['Snapshot exceeds maximum size.']]);
        }

        $key = sprintf(
            'sites/%d/cameras/%d/%s.jpg',
            $camera->site_id,
            $camera->id,
            $payload['event_id'],
        );

        Storage::disk('local')->put($key, $binary);

        return MediaObject::query()->create([
            'site_id' => $camera->site_id,
            'camera_id' => $camera->id,
            'storage_key' => $key,
            'media_type' => 'snapshot',
            'content_type' => 'image/jpeg',
            'captured_at' => $payload['captured_at'],
        ]);
    }

    /**
     * @param  array{x: float|int, y: float|int, w: float|int, h: float|int}  $bbox
     * @return array<int, int>
     */
    private function resolveZoneIds(Camera $camera, array $bbox): array
    {
        $cx = (float) $bbox['x'] + ((float) $bbox['w'] / 2);
        $cy = (float) $bbox['y'] + ((float) $bbox['h'] / 2);

        return $camera->zones
            ->filter(fn ($zone) => $zone->is_active && $this->pointInPolygon($cx, $cy, $zone->polygon ?? []))
            ->pluck('id')
            ->all();
    }

    /**
     * @param  array<int, array{x: float|int, y: float|int}>  $polygon
     */
    private function pointInPolygon(float $x, float $y, array $polygon): bool
    {
        if (count($polygon) < 3) {
            return false;
        }

        $inside = false;
        $j = count($polygon) - 1;

        for ($i = 0; $i < count($polygon); $i++) {
            $xi = (float) ($polygon[$i]['x'] ?? 0);
            $yi = (float) ($polygon[$i]['y'] ?? 0);
            $xj = (float) ($polygon[$j]['x'] ?? 0);
            $yj = (float) ($polygon[$j]['y'] ?? 0);

            if ((($yi > $y) !== ($yj > $y)) && ($x < ($xj - $xi) * ($y - $yi) / (($yj - $yi) ?: 1e-9) + $xi)) {
                $inside = ! $inside;
            }

            $j = $i;
        }

        return $inside;
    }
}
