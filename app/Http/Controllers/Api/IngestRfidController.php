<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestRfidRequest;
use App\Services\Ingest\IngestRfidService;
use Illuminate\Http\JsonResponse;

class IngestRfidController extends Controller
{
    public function __invoke(IngestRfidRequest $request, IngestRfidService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
