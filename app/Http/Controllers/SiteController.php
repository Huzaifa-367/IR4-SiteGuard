<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSiteRequest;
use App\Http\Requests\UpdateSiteRequest;
use App\Models\DetectionModule;
use App\Models\Site;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class SiteController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:sites.view', only: ['index', 'show']),
            new Middleware('permission:sites.create', only: ['create', 'store']),
            new Middleware('permission:sites.update', only: ['edit', 'update']),
            new Middleware('site.access', only: ['show', 'edit', 'update']),
        ];
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Site::query()
            ->withCount(['cameras', 'alerts'])
            ->orderBy('name');

        if ($user !== null && ! $user->can('sites.access_all') && ! $user->hasRole('super_admin')) {
            $query->whereIn('id', $user->sites()->pluck('sites.id'));
        }

        return Inertia::render('sites/index', [
            'sites' => $query->get()->map(fn (Site $site): array => $this->presentSiteListRow($site)),
            'canCreate' => $user?->can('sites.create') ?? false,
            'timezones' => $this->commonTimezones(),
            'openCreateDialog' => $request->boolean('create'),
        ]);
    }

    public function create(Request $request): RedirectResponse
    {
        return redirect()->route('sites.index', ['create' => 1]);
    }

    public function store(StoreSiteRequest $request): RedirectResponse
    {
        $site = Site::query()->create($request->validated());

        $moduleIds = DetectionModule::query()->pluck('id');
        $site->detectionModules()->sync(
            $moduleIds->mapWithKeys(fn (int $id): array => [$id => ['is_enabled' => true]])->all(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Site created.'),
        ]);

        return to_route('sites.show', $site);
    }

    public function show(Request $request, Site $site): Response
    {
        $site->loadCount(['cameras', 'locations', 'alerts']);

        $enabledModuleIds = $site->detectionModules()
            ->wherePivot('is_enabled', true)
            ->pluck('detection_modules.id');

        return Inertia::render('sites/show', [
            'site' => $this->presentSiteDetail($site),
            'cameras' => $site->cameras()
                ->with(['detectionModule:id,name,key', 'ingestToken:id,camera_id,token_prefix,revoked_at,last_used_at'])
                ->orderBy('sort_order')
                ->get()
                ->map(fn ($camera): array => [
                    'id' => $camera->id,
                    'name' => $camera->name,
                    'code' => $camera->code,
                    'module' => $camera->detectionModule?->name,
                    'module_key' => $camera->detectionModule?->key,
                    'health_status' => $camera->health_status,
                    'last_ingest_at' => $camera->last_ingest_at?->toIso8601String(),
                    'is_active' => $camera->is_active,
                    'ingest_token' => $camera->ingestToken ? [
                        'prefix' => $camera->ingestToken->token_prefix,
                        'revoked' => $camera->ingestToken->revoked_at !== null,
                        'last_used_at' => $camera->ingestToken->last_used_at?->toIso8601String(),
                    ] : null,
                ]),
            'detectionModules' => DetectionModule::query()
                ->whereIn('id', $enabledModuleIds)
                ->orderBy('name')
                ->get(['id', 'name', 'key']),
            'ingestTokenPlain' => $request->session()->pull('ingest_token_plain'),
            'timezones' => $this->commonTimezones(),
            'openEditDialog' => $request->boolean('edit'),
            'permissions' => [
                'canUpdateSite' => $request->user()?->can('sites.update') ?? false,
                'canCreateCamera' => $request->user()?->can('cameras.create') ?? false,
                'canManageTokens' => $request->user()?->can('api_tokens.manage') ?? false,
            ],
        ]);
    }

    public function edit(Site $site): RedirectResponse
    {
        return redirect()->route('sites.show', ['site' => $site, 'edit' => 1]);
    }

    public function update(UpdateSiteRequest $request, Site $site): RedirectResponse
    {
        $site->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Site updated.'),
        ]);

        return to_route('sites.show', $site);
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSiteListRow(Site $site): array
    {
        return [
            'id' => $site->id,
            'name' => $site->name,
            'code' => $site->code,
            'timezone' => $site->timezone,
            'status' => $site->status,
            'cameras_count' => $site->cameras_count,
            'alerts_count' => $site->alerts_count,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentSiteDetail(Site $site): array
    {
        return [
            'id' => $site->id,
            'name' => $site->name,
            'code' => $site->code,
            'timezone' => $site->timezone,
            'address' => $site->address,
            'status' => $site->status,
            'cameras_count' => $site->cameras_count ?? $site->cameras()->count(),
            'locations_count' => $site->locations_count ?? $site->locations()->count(),
            'alerts_count' => $site->alerts_count ?? $site->alerts()->count(),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function commonTimezones(): array
    {
        return [
            'UTC',
            'Asia/Dubai',
            'Asia/Riyadh',
            'Asia/Kolkata',
            'Europe/London',
            'America/New_York',
        ];
    }
}
