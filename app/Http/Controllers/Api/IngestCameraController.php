<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestCameraRequest;
use App\Services\Ingest\IngestCameraService;
use Illuminate\Http\JsonResponse;

class IngestCameraController extends Controller
{
    public function __invoke(IngestCameraRequest $request, IngestCameraService $service): JsonResponse
    {
        $bearer = $request->bearerToken() ?? '';

        $result = $service->ingest($bearer, $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
