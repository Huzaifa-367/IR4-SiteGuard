<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestGasRequest;
use App\Services\Ingest\IngestGasService;
use Illuminate\Http\JsonResponse;

/**
 * POST /api/ingest/gas
 *
 * Auth: `Authorization: Bearer <token>` — gas gateway ingest token (prefix `sggas_`).
 * The token must belong to the `gas_gateway_id` in the body.
 *
 * Content-Type: `application/json`
 *
 * Request body:
 * {
 *   "gas_gateway_id": 3,
 *   "payload": {
 *     "event_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "read_at": "2026-06-08T14:30:00Z",
 *     "readings": {
 *       "lel_pct": 0.0,
 *       "o2_pct": 20.9,
 *       "h2s_ppm": 0.0,
 *       "co_ppm": 0.0
 *     },
 *     "alarm_state": "normal",
 *     "alarm_gases": [],
 *     "poll_type": "scheduled",
 *     "detector_serial": "BW-12345"
 *   }
 * }
 *
 * - `gas_gateway_id` (int, required): `gas_gateways.id` for this vehicle gateway.
 * - `payload.event_id` (uuid, required): idempotency key for this poll.
 * - `payload.read_at` (ISO 8601 date, required): sample timestamp.
 * - `payload.readings` (object, required): 4-gas values — all numeric, >= 0.
 * - `payload.alarm_state` (required): `normal` | `low_alarm` | `high_alarm` | `stel` | `twa`.
 * - `payload.alarm_gases` (array, required): may be empty; gases currently in alarm.
 * - `payload.poll_type` (required): `scheduled` | `immediate`.
 * - `payload.detector_serial` (string, optional): detector identifier.
 *
 * Responses:
 * - 202 `{ "status": "accepted", "event_id": "..." }`
 * - 200 `{ "status": "duplicate", "event_id": "..." }` (same `event_id` already ingested)
 * - 422 validation / invalid token
 */
class IngestGasController extends Controller
{
    public function __invoke(IngestGasRequest $request, IngestGasService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
