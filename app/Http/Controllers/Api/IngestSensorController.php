<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestSensorRequest;
use App\Services\Ingest\IngestSensorService;
use Illuminate\Http\JsonResponse;

class IngestSensorController extends Controller
{
    public function __invoke(IngestSensorRequest $request, IngestSensorService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
