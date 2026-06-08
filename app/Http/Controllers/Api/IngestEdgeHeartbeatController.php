<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestEdgeHeartbeatRequest;
use App\Services\Ingest\IngestEdgeHeartbeatService;
use Illuminate\Http\JsonResponse;

/**
 * POST /api/ingest/edge/heartbeat
 *
 * Auth: `Authorization: Bearer <token>` — edge device ingest token (prefix `sgedge_`).
 * The token must belong to the `edge_device_id` in the body.
 *
 * Content-Type: `application/json`
 *
 * Request body:
 * {
 *   "edge_device_id": 1,
 *   "payload": {
 *     "event_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "reported_at": "2026-06-08T14:30:00Z",
 *     "vpn_up": true,
 *     "storage_free_gb": 128.5,
 *     "pole_streams_active": 4,
 *     "cameras_online": 6,
 *     "rfid_reader_ok": true,
 *     "modbus_bus_ok": true,
 *     "software_version": "1.2.3"
 *   }
 * }
 *
 * - `edge_device_id` (int, required): `edge_devices.id` for this edge node.
 * - `payload.event_id` (uuid, required): unique heartbeat event id.
 * - `payload.reported_at` (ISO 8601 date, required): when the edge reported status.
 * - `payload.vpn_up` (bool, optional): VPN tunnel health.
 * - `payload.storage_free_gb` (numeric, optional): free disk space.
 * - `payload.pole_streams_active` (int >= 0, optional): active RTSP streams.
 * - `payload.cameras_online` (int >= 0, optional): cameras currently online.
 * - `payload.rfid_reader_ok` (bool, optional): RFID ingest path health.
 * - `payload.modbus_bus_ok` (bool, optional): Modbus / sensor bus health.
 * - `payload.software_version` (string, optional): edge software version string.
 *
 * Responses:
 * - 202 `{ "status": "accepted", "event_id": "..." }`
 * - 422 validation / invalid token
 */
class IngestEdgeHeartbeatController extends Controller
{
    public function __invoke(IngestEdgeHeartbeatRequest $request, IngestEdgeHeartbeatService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, 202);
    }
}
