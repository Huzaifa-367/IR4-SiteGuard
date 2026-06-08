<?php

namespace App\Services\Ingest;

use App\Models\Alert;
use App\Models\EdgeDevice;
use App\Models\HseIncident;
use App\Models\MediaObject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class IngestMediaService
{
    public function __construct(
        private readonly IngestTokenService $tokens,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{status: string, media_id: int}
     */
    public function ingest(string $bearer, array $validated, UploadedFile $file): array
    {
        $token = $this->tokens->findByBearer($bearer);

        if ($token === null || ! $token->isValid()) {
            throw ValidationException::withMessages(['authorization' => ['Invalid ingest token.']]);
        }

        $edge = EdgeDevice::query()->with('site')->findOrFail((int) $validated['edge_device_id']);

        if (! $this->tokens->matchesTokenable($token, $edge)) {
            throw ValidationException::withMessages(['edge_device_id' => ['Token is not valid for this edge device.']]);
        }

        $maxBytes = (int) config('siteguard.media_clip_max_bytes', 50 * 1024 * 1024);

        if ($file->getSize() > $maxBytes) {
            throw ValidationException::withMessages(['file' => ['Media clip exceeds maximum size.']]);
        }

        $extension = $file->guessExtension() ?: 'mp4';
        $storageKey = sprintf(
            'sites/%d/media/%s.%s',
            $edge->site_id,
            $validated['event_id'],
            $extension,
        );

        Storage::disk('local')->put($storageKey, $file->get());

        $media = MediaObject::query()->create([
            'site_id' => $edge->site_id,
            'camera_id' => $validated['camera_id'] ?? null,
            'storage_key' => $storageKey,
            'media_type' => 'incident_clip',
            'content_type' => $file->getMimeType() ?: 'video/mp4',
            'captured_at' => $validated['captured_at'],
        ]);

        $this->linkToIncident($edge->site_id, $media->id, $validated);

        return [
            'status' => 'accepted',
            'media_id' => $media->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function linkToIncident(int $siteId, int $mediaId, array $validated): void
    {
        if (isset($validated['alert_id'])) {
            $incident = HseIncident::query()
                ->where('site_id', $siteId)
                ->whereJsonContains('alert_ids', (int) $validated['alert_id'])
                ->first();

            if ($incident !== null) {
                $ids = [...($incident->video_evidence_media_ids ?? []), $mediaId];
                $incident->update(['video_evidence_media_ids' => array_values(array_unique($ids))]);

                return;
            }

            $alert = Alert::query()->where('site_id', $siteId)->find($validated['alert_id']);

            if ($alert !== null) {
                return;
            }
        }

        if (isset($validated['incident_id'])) {
            $incident = HseIncident::query()
                ->where('site_id', $siteId)
                ->find($validated['incident_id']);

            if ($incident !== null) {
                $ids = [...($incident->video_evidence_media_ids ?? []), $mediaId];
                $incident->update(['video_evidence_media_ids' => array_values(array_unique($ids))]);
            }
        }
    }
}
