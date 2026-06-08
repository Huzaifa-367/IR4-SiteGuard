<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateInvestigationFromAlertRequest;
use App\Http\Requests\LinkAlertInvestigationRequest;
use App\Models\Alert;
use App\Models\AlertAction;
use App\Models\HseIncident;
use App\Models\Investigation;
use App\Models\User;
use App\Support\Iot\IotTimeRange;
use App\Support\MediaObjectUrl;
use App\Support\SelectedSiteManager;
use App\Support\SiteGuardEnums;
use App\Support\SiteRuleResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:alerts.view', only: ['index', 'show']),
            new Middleware('permission:alerts.acknowledge', only: ['acknowledge']),
            new Middleware('permission:alerts.dismiss', only: ['dismiss']),
            new Middleware('permission:investigations.manage', only: ['createInvestigation', 'linkInvestigation']),
            new Middleware('permission:hse_incidents.classify', only: ['createHseIncident']),
        ];
    }

    public function index(Request $request, SelectedSiteManager $selectedSiteManager): Response
    {
        $siteIds = $selectedSiteManager->siteIdsForScope($request);

        $query = Alert::query()
            ->with([
                'site:id,name',
                'camera:id,name',
                'rule:id,name,code',
                'firstDetectionEvent.snapshot:id,storage_key,content_type',
            ])
            ->latest('opened_at');

        if ($siteIds !== []) {
            $query->whereIn('site_id', $siteIds);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        IotTimeRange::applySince($query, 'opened_at', IotTimeRange::listDaysFromRequest($request));

        $alerts = $query->paginate(IotTimeRange::perPage())->withQueryString();

        $alerts->through(fn (Alert $alert): array => $this->formatAlertSummary($alert));

        return Inertia::render('alerts/index', [
            'alerts' => $alerts,
            'filters' => [
                'status' => $request->string('status')->toString(),
                ...IotTimeRange::listFilters($request),
            ],
            'statusOptions' => SiteGuardEnums::options('alert_statuses'),
        ]);
    }

    public function show(Request $request, Alert $alert): Response
    {
        $this->ensureSiteAccess($request, $alert->site_id);

        $alert->load([
            'site:id,name',
            'camera:id,name',
            'rule:id,name,code,severity',
            'actions.user:id,name',
            'assignedUser:id,name',
            'firstDetectionEvent.snapshot:id,storage_key,content_type,captured_at',
            'investigations' => fn ($q) => $q->with('assignedUser:id,name')->orderByDesc('opened_at'),
        ]);

        $openInvestigations = Investigation::query()
            ->where('site_id', $alert->site_id)
            ->where('status', 'open')
            ->orderByDesc('opened_at')
            ->get(['id', 'title']);

        $linkedHseIncident = HseIncident::query()
            ->where('site_id', $alert->site_id)
            ->whereJsonContains('alert_ids', $alert->id)
            ->first(['id', 'incident_number', 'status']);

        return Inertia::render('alerts/show', [
            'alert' => $this->formatAlertDetail($alert),
            'linkedHseIncident' => $linkedHseIncident ? [
                'id' => $linkedHseIncident->id,
                'incident_number' => $linkedHseIncident->incident_number,
                'status' => $linkedHseIncident->status,
            ] : null,
            'actions' => $alert->actions->map(fn (AlertAction $action): array => [
                'id' => $action->id,
                'action' => $action->action,
                'note' => $action->note,
                'reason_code' => $action->reason_code,
                'user' => $action->user?->name,
                'created_at' => $action->created_at?->toIso8601String(),
            ]),
            'permissions' => [
                'canAcknowledge' => $request->user()?->can('alerts.acknowledge') ?? false,
                'canDismiss' => $request->user()?->can('alerts.dismiss') ?? false,
                'canManageInvestigations' => $request->user()?->can('investigations.manage') ?? false,
                'canCreateHseIncident' => $request->user()?->can('hse_incidents.classify') ?? false,
            ],
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
            'openInvestigations' => $openInvestigations->map(fn (Investigation $inv): array => [
                'id' => $inv->id,
                'title' => $inv->title,
            ]),
        ]);
    }

    public function acknowledge(Request $request, Alert $alert): RedirectResponse
    {
        $this->ensureSiteAccess($request, $alert->site_id);

        if ($alert->status !== 'open') {
            return back();
        }

        $alert->update(['status' => 'acknowledged']);

        AlertAction::query()->create([
            'alert_id' => $alert->id,
            'user_id' => $request->user()?->id,
            'action' => 'acknowledge',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Alert acknowledged.'),
        ]);

        return to_route('alerts.show', $alert);
    }

    public function dismiss(Request $request, Alert $alert): RedirectResponse
    {
        $this->ensureSiteAccess($request, $alert->site_id);

        $alert->update([
            'status' => 'dismissed',
            'closed_at' => now(),
        ]);

        AlertAction::query()->create([
            'alert_id' => $alert->id,
            'user_id' => $request->user()?->id,
            'action' => 'dismiss',
            'note' => $request->string('note')->toString() ?: null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Alert dismissed.'),
        ]);

        return to_route('alerts.show', $alert);
    }

    public function createInvestigation(
        CreateInvestigationFromAlertRequest $request,
        Alert $alert,
    ): RedirectResponse {
        $this->ensureSiteAccess($request, $alert->site_id);

        $validated = $request->validated();
        $description = sprintf(
            "[Priority: %s]\n\n%s",
            $validated['priority'],
            $validated['description'],
        );

        $investigation = Investigation::query()->create([
            'site_id' => $alert->site_id,
            'title' => $validated['title'],
            'description' => $description,
            'status' => 'open',
            'opened_by_user_id' => $request->user()?->id,
            'assigned_user_id' => $validated['assigned_user_id'],
            'opened_at' => now(),
        ]);

        $investigation->alerts()->syncWithoutDetaching([$alert->id]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Investigation opened and linked to this alert.'),
        ]);

        return to_route('investigations.show', $investigation);
    }

    public function linkInvestigation(
        LinkAlertInvestigationRequest $request,
        Alert $alert,
    ): RedirectResponse {
        $this->ensureSiteAccess($request, $alert->site_id);

        $investigation = Investigation::query()->findOrFail($request->integer('investigation_id'));

        if ($investigation->site_id !== $alert->site_id) {
            abort(422, 'Investigation must belong to the same site as the alert.');
        }

        $investigation->alerts()->syncWithoutDetaching([$alert->id]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Alert linked to investigation.'),
        ]);

        return to_route('alerts.show', $alert);
    }

    public function createHseIncident(Request $request, Alert $alert): RedirectResponse
    {
        $this->ensureSiteAccess($request, $alert->site_id);

        $existing = HseIncident::query()
            ->where('site_id', $alert->site_id)
            ->whereJsonContains('alert_ids', $alert->id)
            ->first();

        if ($existing !== null) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => __('HSE incident already linked to this alert.'),
            ]);

            return to_route('iot.hse-incidents.show', $existing);
        }

        $alert->loadMissing('rule');
        $incidentType = SiteRuleResolver::incidentTypeFor($alert->rule);

        $incident = HseIncidentController::createDraftFromAlert(
            $alert->site_id,
            $incidentType,
            $alert->title,
            $alert->id,
            $alert->metadata['rfid_zone_id'] ?? null,
            $alert->camera_id,
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('HSE incident draft created.'),
        ]);

        return to_route('iot.hse-incidents.show', $incident);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAlertSummary(Alert $alert): array
    {
        return [
            'id' => $alert->id,
            'title' => $alert->title,
            'severity' => $alert->severity,
            'status' => $alert->status,
            'opened_at' => $alert->opened_at?->toIso8601String(),
            'snapshot_url' => MediaObjectUrl::resolve($alert->firstDetectionEvent?->snapshot),
            'site' => $alert->site?->only(['id', 'name']),
            'camera' => $alert->camera?->only(['id', 'name']),
            'rule' => $alert->rule?->only(['id', 'name', 'code']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatAlertDetail(Alert $alert): array
    {
        return [
            ...$this->formatAlertSummary($alert),
            'occurrence_count' => $alert->occurrence_count,
            'closed_at' => $alert->closed_at?->toIso8601String(),
            'captured_at' => $alert->firstDetectionEvent?->snapshot?->captured_at?->toIso8601String()
                ?? $alert->firstDetectionEvent?->captured_at?->toIso8601String(),
            'rule' => $alert->rule?->only(['id', 'name', 'code', 'severity']),
            'assigned_user' => $alert->assignedUser?->only(['id', 'name']),
            'investigations' => $alert->investigations->map(fn (Investigation $inv): array => [
                'id' => $inv->id,
                'title' => $inv->title,
                'status' => $inv->status,
                'assigned_user' => $inv->assignedUser?->name,
                'opened_at' => $inv->opened_at?->toIso8601String(),
            ]),
        ];
    }

    private function ensureSiteAccess(Request $request, int $siteId): void
    {
        $user = $request->user();

        if ($user === null || ! $user->canAccessSite($siteId)) {
            abort(403);
        }
    }
}
