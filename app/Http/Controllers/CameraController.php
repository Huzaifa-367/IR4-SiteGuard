<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCameraRequest;
use App\Http\Requests\UpdateCameraRequest;
use App\Models\Camera;
use App\Models\Site;
use App\Services\Ingest\IngestTokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class CameraController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:cameras.create', only: ['store']),
            new Middleware('permission:cameras.update', only: ['update', 'issueIngestToken']),
            new Middleware('permission:cameras.delete', only: ['destroy']),
            new Middleware('permission:api_tokens.manage', only: ['issueIngestToken', 'revokeIngestToken']),
        ];
    }

    public function store(StoreCameraRequest $request, Site $site): RedirectResponse
    {
        $site->cameras()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Camera created.'),
        ]);

        return to_route('sites.show', $site);
    }

    public function update(UpdateCameraRequest $request, Camera $camera): RedirectResponse
    {
        $camera->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Camera updated.'),
        ]);

        return to_route('sites.show', $camera->site_id);
    }

    public function destroy(Camera $camera): RedirectResponse
    {
        $siteId = $camera->site_id;
        $camera->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Camera deleted.'),
        ]);

        return to_route('sites.show', $siteId);
    }

    public function issueIngestToken(Request $request, Camera $camera, IngestTokenService $tokens): RedirectResponse
    {
        $issued = $tokens->issueForCamera($camera, $request->user());

        return to_route('sites.show', $camera->site_id)->with('ingest_token_plain', $issued['plain_text']);
    }

    public function revokeIngestToken(Camera $camera): RedirectResponse
    {
        $camera->ingestToken?->update(['revoked_at' => now()]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Ingest token revoked.'),
        ]);

        return to_route('sites.show', $camera->site_id);
    }
}
