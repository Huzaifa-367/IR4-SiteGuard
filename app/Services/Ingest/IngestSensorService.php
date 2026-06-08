<?php

namespace App\Services\Ingest;

use App\Models\SensorDevice;
use App\Models\SensorReading;
use App\Services\Sensor\SensorThresholdService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class IngestSensorService
{
    public function __construct(
        private readonly IngestTokenService $tokens,
        private readonly SensorThresholdService $thresholds,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     * @return array{status: string, event_id: string, readings_accepted: int}
     */
    public function ingest(string $bearer, array $validated): array
    {
        $token = $this->tokens->findByBearer($bearer);

        if ($token === null || ! $token->isValid()) {
            throw ValidationException::withMessages(['authorization' => ['Invalid ingest token.']]);
        }

        $deviceId = (int) $validated['sensor_device_id'];
        $device = SensorDevice::query()->with('site')->findOrFail($deviceId);

        if (! $this->tokens->matchesTokenable($token, $device)) {
            throw ValidationException::withMessages(['sensor_device_id' => ['Token is not valid for this sensor device.']]);
        }

        $payload = $validated['payload'];
        $eventId = (string) $payload['event_id'];

        if (SensorReading::query()->where('sensor_device_id', $device->id)->where('event_id', $eventId)->exists()) {
            return [
                'status' => 'duplicate',
                'event_id' => $eventId,
                'readings_accepted' => 0,
            ];
        }

        return DB::transaction(function () use ($token, $device, $payload, $eventId): array {
            $count = 0;

            foreach ($payload['readings'] as $reading) {
                SensorReading::query()->create([
                    'site_id' => $device->site_id,
                    'sensor_device_id' => $device->id,
                    'parameter' => $reading['parameter'],
                    'value' => $reading['value'],
                    'unit' => $reading['unit'],
                    'quality' => $reading['quality'] ?? 'good',
                    'assurance_tier' => 'instrumented',
                    'read_at' => $payload['read_at'],
                    'event_id' => $eventId,
                ]);

                $this->thresholds->evaluateSensorReading($device, $reading, $payload['read_at']);
                $count++;
            }

            $device->update([
                'last_ingest_at' => now(),
                'health_status' => 'online',
            ]);

            $token->update(['last_used_at' => now()]);

            return [
                'status' => 'accepted',
                'event_id' => $eventId,
                'readings_accepted' => $count,
            ];
        });
    }
}
