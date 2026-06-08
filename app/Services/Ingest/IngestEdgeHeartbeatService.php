<?php

namespace App\Services\Ingest;

use App\Models\EdgeDevice;
use Illuminate\Validation\ValidationException;

class IngestEdgeHeartbeatService
{
    public function __construct(
        private readonly IngestTokenService $tokens,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{status: string, event_id: string}
     */
    public function ingest(string $bearer, array $validated): array
    {
        $token = $this->tokens->findByBearer($bearer);

        if ($token === null || ! $token->isValid()) {
            throw ValidationException::withMessages(['authorization' => ['Invalid ingest token.']]);
        }

        $edgeId = (int) $validated['edge_device_id'];
        $edge = EdgeDevice::query()->findOrFail($edgeId);

        if (! $this->tokens->matchesTokenable($token, $edge)) {
            throw ValidationException::withMessages(['edge_device_id' => ['Token is not valid for this edge device.']]);
        }

        $payload = $validated['payload'];

        $edge->update([
            'last_heartbeat_at' => $payload['reported_at'],
            'health_status' => ($payload['vpn_up'] ?? true) ? 'online' : 'degraded',
            'software_version' => $payload['software_version'] ?? $edge->software_version,
        ]);

        $token->update(['last_used_at' => now()]);

        return [
            'status' => 'accepted',
            'event_id' => (string) $payload['event_id'],
        ];
    }
}
