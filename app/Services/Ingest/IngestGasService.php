<?php

namespace App\Services\Ingest;

use App\Models\GasGateway;
use App\Models\GasReading;
use App\Services\Sensor\SensorThresholdService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IngestGasService
{
    public function __construct(
        private readonly IngestTokenService $tokens,
        private readonly SensorThresholdService $thresholds,
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

        $gatewayId = (int) $validated['gas_gateway_id'];
        $gateway = GasGateway::query()->with('site')->findOrFail($gatewayId);

        if (! $this->tokens->matchesTokenable($token, $gateway)) {
            throw ValidationException::withMessages(['gas_gateway_id' => ['Token is not valid for this gas gateway.']]);
        }

        $payload = $validated['payload'];
        $eventId = (string) $payload['event_id'];

        if (GasReading::query()->where('event_id', $eventId)->exists()) {
            return ['status' => 'duplicate', 'event_id' => $eventId];
        }

        return DB::transaction(function () use ($token, $gateway, $payload, $eventId): array {
            $readings = $payload['readings'];

            GasReading::query()->create([
                'site_id' => $gateway->site_id,
                'gas_gateway_id' => $gateway->id,
                'lel_pct' => $readings['lel_pct'],
                'o2_pct' => $readings['o2_pct'],
                'h2s_ppm' => $readings['h2s_ppm'],
                'co_ppm' => $readings['co_ppm'],
                'alarm_state' => $payload['alarm_state'],
                'alarm_gases' => $payload['alarm_gases'],
                'poll_type' => $payload['poll_type'],
                'detector_serial' => $payload['detector_serial'] ?? null,
                'read_at' => $payload['read_at'],
                'event_id' => $eventId,
            ]);

            $this->thresholds->evaluateGasReading($gateway, $readings, $payload['read_at']);

            $gateway->update([
                'last_ingest_at' => now(),
                'health_status' => 'online',
            ]);

            $token->update(['last_used_at' => now()]);

            return ['status' => 'accepted', 'event_id' => $eventId];
        });
    }
}
