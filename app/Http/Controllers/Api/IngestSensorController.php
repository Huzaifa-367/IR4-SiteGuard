<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestSensorRequest;
use App\Services\Ingest\IngestSensorService;
use Illuminate\Http\JsonResponse;

/**
 * POST /api/ingest/sensor
 *
 * Auth: `Authorization: Bearer <token>` — sensor device ingest token (prefix `sgsensor_`).
 * The token must belong to the `sensor_device_id` in the body.
 *
 * Content-Type: `application/json`
 *
 * Request body:
 * {
 *   "sensor_device_id": 7,
 *   "payload": {
 *     "event_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "read_at": "2026-06-08T14:30:00Z",
 *     "readings": [
 *       { "parameter": "co2_ppm", "value": 412.5, "unit": "ppm", "quality": "good" },
 *       { "parameter": "temp_c", "value": 28.3, "unit": "C", "quality": "good" }
 *     ]
 *   }
 * }
 *
 * - `sensor_device_id` (int, required): `sensor_devices.id` for this instrument.
 * - `payload.event_id` (uuid, required): idempotency key for this sample set.
 * - `payload.read_at` (ISO 8601 date, required): sample timestamp (shared by all readings).
 * - `payload.readings` (array, min 1, required):
 *   - `parameter` (string, required): e.g. `co2_ppm`, `temp_c`, `humidity_pct`, `wind_speed_mps`.
 *   - `value` (numeric, required): measured value.
 *   - `unit` (string, required): display unit (e.g. `ppm`, `C`, `%`, `m/s`).
 *   - `quality` (`good`|`uncertain`|`bad`, optional): defaults to `good`.
 *
 * Responses:
 * - 202 `{ "status": "accepted", "event_id": "...", "readings_accepted": 2 }`
 * - 200 `{ "status": "duplicate", "event_id": "...", "readings_accepted": 0 }`
 * - 422 validation / invalid token
 */
class IngestSensorController extends Controller
{
    public function __invoke(IngestSensorRequest $request, IngestSensorService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
