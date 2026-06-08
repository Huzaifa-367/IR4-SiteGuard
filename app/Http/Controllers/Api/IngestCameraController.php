<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestCameraRequest;
use App\Services\Ingest\IngestCameraService;
use Illuminate\Http\JsonResponse;

/**
 * POST /api/ingest/camera
 *
 * Auth: `Authorization: Bearer <token>` — camera ingest token (prefix `sgcam_`).
 * The token must belong to the `camera_id` in the body.
 *
 * Content-Type: `application/json`
 *
 * Request body:
 * {
 *   "camera_id": 5,
 *   "payload": {
 *     "event_id": "550e8400-e29b-41d4-a716-446655440000",
 *     "captured_at": "2026-06-08T14:30:00Z",
 *     "snapshot": "<base64-encoded JPEG>",
 *     "detections": [
 *       {
 *         "classes": [
 *           { "key": "person", "confidence": 0.92 }
 *         ],
 *         "bbox": { "x": 0.12, "y": 0.34, "w": 0.18, "h": 0.42 },
 *         "distance_m": 4.5
 *       }
 *     ]
 *   }
 * }
 *
 * - `camera_id` (int, required): `cameras.id` for this camera.
 * - `payload.event_id` (uuid, required): idempotency key for the frame batch.
 * - `payload.captured_at` (ISO 8601 date, required): frame capture time.
 * - `payload.snapshot` (string, required): base64-encoded JPEG (max 5 MB decoded).
 * - `payload.detections` (array, min 1, required): one entry per detected object.
 *   - `classes` (array, min 1): `{ "key": string, "confidence": 0–1 }`.
 *   - `bbox` (object, required): normalized box — `x`, `y`, `w`, `h` each 0–1 (top-left origin).
 *   - `distance_m` (numeric >= 0, optional): estimated distance in metres.
 *
 * Responses:
 * - 202 `{ "status": "accepted", "ingest_event_id": "...", "detection_count": 2 }`
 * - 200 `{ "status": "duplicate", "ingest_event_id": "...", "detection_count": 0 }`
 * - 422 validation / invalid token / inactive camera / invalid base64 snapshot
 */
class IngestCameraController extends Controller
{
    public function __invoke(IngestCameraRequest $request, IngestCameraService $service): JsonResponse
    {
        $bearer = $request->bearerToken() ?? '';

        $result = $service->ingest($bearer, $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
