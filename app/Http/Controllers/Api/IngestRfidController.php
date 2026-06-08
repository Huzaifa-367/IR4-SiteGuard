<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestRfidRequest;
use App\Services\Ingest\IngestRfidService;
use Illuminate\Http\JsonResponse;

/**
 * POST /api/ingest/rfid
 *
 * Auth: `Authorization: Bearer <token>` — RFID reader ingest token (prefix `sgrfid_`).
 * The token must belong to the `reader_id` in the body.
 *
 * Content-Type: `application/json`
 *
 * Request body:
 * {
 *   "reader_id": 12,
 *   "payload": {
 *     "batch_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "read_at": "2026-06-08T14:30:00Z",
 *     "events": [
 *       {
 *         "epc": "E28011606000020400001234",
 *         "rssi": -62,
 *         "direction": "entry",
 *         "read_at": "2026-06-08T14:30:01Z"
 *       }
 *     ]
 *   }
 * }
 *
 * - `reader_id` (int, required): `rfid_readers.id` for this reader.
 * - `payload.batch_id` (uuid, required): idempotency key for the whole batch.
 * - `payload.read_at` (ISO 8601 date, required): default timestamp for events.
 * - `payload.events` (array, min 1, required):
 *   - `epc` (string, required): RFID tag EPC.
 *   - `rssi` (int, optional): signal strength in dBm.
 *   - `direction` (`entry`|`exit`, optional): required for gate readers; omitted for zone readers.
 *   - `read_at` (ISO 8601 date, optional): per-tag timestamp; falls back to `payload.read_at`.
 *
 * Responses:
 * - 202 `{ "status": "accepted", "batch_id": "...", "events_accepted": 3 }`
 * - 200 `{ "status": "duplicate", "batch_id": "...", "events_accepted": 0 }` (same `batch_id` already ingested)
 * - 422 validation / invalid token / gate reader missing `direction`
 */
class IngestRfidController extends Controller
{
    public function __invoke(IngestRfidRequest $request, IngestRfidService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
