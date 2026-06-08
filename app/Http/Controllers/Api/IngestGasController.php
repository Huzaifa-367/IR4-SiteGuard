<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestGasRequest;
use App\Services\Ingest\IngestGasService;
use Illuminate\Http\JsonResponse;

class IngestGasController extends Controller
{
    public function __invoke(IngestGasRequest $request, IngestGasService $service): JsonResponse
    {
        $result = $service->ingest($request->bearerToken() ?? '', $request->validated());

        return response()->json($result, $result['status'] === 'duplicate' ? 200 : 202);
    }
}
