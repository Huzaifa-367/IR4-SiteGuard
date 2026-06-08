<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestMediaRequest;
use App\Services\Ingest\IngestMediaService;
use Illuminate\Http\JsonResponse;

/**
 * POST /api/ingest/media
 *
 * Auth: `Authorization: Bearer <token>` — edge device ingest token (prefix `sgedge_`).
 * The token must belong to the `edge_device_id` in the form fields.
 *
 * Content-Type: `multipart/form-data`
 *
 * Form fields:
 * - `edge_device_id` (int, required): `edge_devices.id` uploading the clip.
 * - `event_id` (uuid, required): unique id for this media upload.
 * - `captured_at` (ISO 8601 date, required): when the clip was recorded.
 * - `camera_id` (int, optional): `cameras.id` source camera.
 * - `alert_id` (int, optional): link clip to an existing `alerts.id`.
 * - `incident_id` (int, optional): link clip to an existing `hse_incidents.id`.
 * - `file` (file, required): video clip — `video/mp4`, `video/quicktime`, `video/x-msvideo`,
 *   or `application/octet-stream`; max 50 MB (51200 KB).
 *
 * Example (curl):
 * curl -X POST /api/ingest/media \
 *   -H "Authorization: Bearer sgedge_..." \
 *   -F "edge_device_id=1" \
 *   -F "event_id=550e8400-e29b-41d4-a716-446655440000" \
 *   -F "captured_at=2026-06-08T14:30:00Z" \
 *   -F "camera_id=5" \
 *   -F "file=@incident.mp4"
 *
 * Responses:
 * - 202 `{ "status": "accepted", "media_id": 42 }`
 * - 422 validation / invalid token
 */
class IngestMediaController extends Controller
{
    public function __invoke(IngestMediaRequest $request, IngestMediaService $service): JsonResponse
    {
        $bearer = $request->bearerToken() ?? '';

        $result = $service->ingest($bearer, $request->validated(), $request->file('file'));

        return response()->json($result, 202);
    }
}
