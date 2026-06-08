<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreInvestigationRequest;
use App\Models\Alert;
use App\Models\Investigation;
use App\Models\User;
use App\Support\Iot\IotTimeRange;
use App\Support\MediaObjectUrl;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class InvestigationController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:investigations.manage', only: ['index', 'show', 'store', 'close']),
        ];
    }

    public function index(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $query = $site->investigations()->with(['assignedUser:id,name'])->latest('opened_at');
        IotTimeRange::applySince($query, 'opened_at', $listDays);

        $investigations = $query
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (Investigation $inv): array => [
                'id' => $inv->id,
                'title' => $inv->title,
                'status' => $inv->status,
                'assigned_user' => $inv->assignedUser?->name,
                'opened_at' => $inv->opened_at?->toIso8601String(),
                'alerts_count' => $inv->alerts()->count(),
            ]);

        return Inertia::render('investigations/index', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'investigations' => $investigations,
            'filters' => IotTimeRange::listFilters($request),
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function show(Request $request, Investigation $investigation): Response
    {
        $site = $this->selectedSite($request);
        abort_unless($investigation->site_id === $site->id, 404);

        $investigation->load([
            'assignedUser:id,name',
            'openedBy:id,name',
            'alerts.camera:id,name',
            'alerts.firstDetectionEvent.snapshot:id,storage_key,content_type',
        ]);

        return Inertia::render('investigations/show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'investigation' => [
                'id' => $investigation->id,
                'title' => $investigation->title,
                'description' => $investigation->description,
                'status' => $investigation->status,
                'opened_at' => $investigation->opened_at?->toIso8601String(),
                'closed_at' => $investigation->closed_at?->toIso8601String(),
                'assigned_user' => $investigation->assignedUser?->name,
                'opened_by' => $investigation->openedBy?->name,
            ],
            'linkedAlerts' => $investigation->alerts->map(fn (Alert $alert): array => [
                'id' => $alert->id,
                'title' => $alert->title,
                'severity' => $alert->severity,
                'status' => $alert->status,
                'camera' => $alert->camera?->name,
                'snapshot_url' => MediaObjectUrl::resolve($alert->firstDetectionEvent?->snapshot),
            ]),
        ]);
    }

    public function store(StoreInvestigationRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $validated = $request->validated();

        $investigation = $site->investigations()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => 'open',
            'opened_by_user_id' => $request->user()?->id,
            'assigned_user_id' => $validated['assigned_user_id'] ?? null,
            'opened_at' => now(),
        ]);

        if (! empty($validated['alert_ids'])) {
            $investigation->alerts()->sync($validated['alert_ids']);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Investigation created.')]);

        return to_route('investigations.show', $investigation);
    }

    public function close(Request $request, Investigation $investigation): RedirectResponse
    {
        $site = $this->selectedSite($request);
        abort_unless($investigation->site_id === $site->id, 404);

        $investigation->update([
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Investigation closed.')]);

        return to_route('investigations.show', $investigation);
    }
}
