<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\IngestMediaRequest;
use App\Services\Ingest\IngestMediaService;
use Illuminate\Http\JsonResponse;

class IngestMediaController extends Controller
{
    public function __invoke(IngestMediaRequest $request, IngestMediaService $service): JsonResponse
    {
        $bearer = $request->bearerToken() ?? '';

        $result = $service->ingest($bearer, $request->validated(), $request->file('file'));

        return response()->json($result, 202);
    }
}
