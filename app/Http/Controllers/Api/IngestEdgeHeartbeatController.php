<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestEdgeHeartbeatRequest;
use App\Services\Ingest\IngestEdgeHeartbeatService;
use Illuminate\Http\JsonResponse;

class IngestEdgeHeartbeatController extends Controller
{
    public function __invoke(IngestEdgeHeartbeatRequest $request, IngestEdgeHeartbeatService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, 202);
    }
}
