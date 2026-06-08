<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\ClassifyHseIncidentRequest;
use App\Models\Alert;
use App\Models\Camera;
use App\Models\HseIncident;
use App\Models\RfidZone;
use App\Models\Site;
use App\Services\Reports\UdpmWeeklyReportService;
use App\Support\Iot\IotTimeRange;
use App\Support\IotAnalytics;
use App\Support\SiteGuardEnums;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class HseIncidentController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:hse_incidents.view', only: ['overview', 'register', 'show']),
            new Middleware('permission:hse_incidents.classify', only: ['classify']),
        ];
    }

    public function overview(Request $request, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);

        $selectedDays = IotTimeRange::chartDaysFromRequest($request);
        $chartDays = IotTimeRange::effectiveChartDays($selectedDays);

        $incidentQuery = HseIncident::query()->where('site_id', $site->id);
        IotTimeRange::applySince($incidentQuery, 'occurred_at', $selectedDays);

        return Inertia::render('iot/hse-incidents/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'summary' => [
                'total' => (clone $incidentQuery)->count(),
                'pending' => (clone $incidentQuery)->whereIn('status', ['draft', 'pending_classification'])->count(),
                'classified' => (clone $incidentQuery)->where('status', 'classified')->count(),
                'critical' => (clone $incidentQuery)->where('severity', 'critical')->count(),
            ],
            'analytics' => $iotAnalytics->hsePageAnalytics($site->id, $chartDays, $selectedDays),
            'filters' => IotTimeRange::chartFilters($request),
        ]);
    }

    public function register(Request $request): Response
    {
        $site = $this->selectedSite($request);

        $listDays = IotTimeRange::listDaysFromRequest($request);

        $incidentQuery = HseIncident::query()
            ->where('site_id', $site->id)
            ->orderByDesc('occurred_at');

        IotTimeRange::applySince($incidentQuery, 'occurred_at', $listDays);

        $incidents = $incidentQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (HseIncident $incident): array => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'status' => $incident->status,
                'severity' => $incident->severity,
                'incident_type' => $incident->incident_type,
                'occurred_at' => $incident->occurred_at->toIso8601String(),
            ]);

        return Inertia::render('iot/hse-incidents/register', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'incidents' => $incidents,
            'filters' => IotTimeRange::listFilters($request),
            'permissions' => [
                'canClassify' => $request->user()?->can('hse_incidents.classify') ?? false,
            ],
        ]);
    }

    public function show(Request $request, HseIncident $incident): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $incident->site_id === (int) $site->id, 404);

        $alertIds = collect($incident->alert_ids ?? []);
        $linkedAlerts = $alertIds->isEmpty()
            ? collect()
            : Alert::query()
                ->where('site_id', $site->id)
                ->whereIn('id', $alertIds)
                ->get(['id', 'title', 'severity', 'status', 'opened_at']);

        $camera = $incident->camera_id
            ? Camera::query()->where('site_id', $site->id)->find($incident->camera_id, ['id', 'name'])
            : null;
        $rfidZone = $incident->rfid_zone_id
            ? RfidZone::query()->where('site_id', $site->id)->find($incident->rfid_zone_id, ['id', 'name', 'code'])
            : null;

        return Inertia::render('iot/hse-incident-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'incident' => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'status' => $incident->status,
                'severity' => $incident->severity,
                'incident_type' => $incident->incident_type,
                'occurred_at' => $incident->occurred_at->toIso8601String(),
                'classification' => $incident->classification,
                'workers_involved' => $incident->workers_involved,
            ],
            'linkedAlerts' => $linkedAlerts->map(fn (Alert $alert): array => [
                'id' => $alert->id,
                'title' => $alert->title,
                'severity' => $alert->severity,
                'status' => $alert->status,
                'opened_at' => $alert->opened_at?->toIso8601String(),
            ])->values()->all(),
            'camera' => $camera ? ['id' => $camera->id, 'name' => $camera->name] : null,
            'rfidZone' => $rfidZone ? ['id' => $rfidZone->id, 'name' => $rfidZone->name, 'code' => $rfidZone->code] : null,
            'incidentTypeOptions' => SiteGuardEnums::options('hse_incident_types'),
            'severityOptions' => SiteGuardEnums::options('hse_severities'),
            'rootCauseOptions' => SiteGuardEnums::options('hse_root_cause_categories'),
            'permissions' => [
                'canClassify' => $request->user()?->can('hse_incidents.classify') ?? false,
            ],
        ]);
    }

    public function classify(
        ClassifyHseIncidentRequest $request,
        HseIncident $incident,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $incident->site_id === (int) $site->id, 404);

        $incident->update([
            'status' => 'classified',
            'severity' => $request->validated('severity'),
            'incident_type' => $request->validated('incident_type'),
            'classification' => [
                'nature_of_incident' => $request->validated('nature_of_incident'),
                'immediate_action_taken' => $request->validated('immediate_action_taken'),
                'corrective_action' => $request->validated('corrective_action'),
                'root_cause_category' => $request->validated('root_cause_category'),
                'actions_taken' => $request->validated('actions_taken'),
            ],
            'classified_by_user_id' => $request->user()?->id,
            'classified_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Incident classified.'),
        ]);

        return to_route('iot.hse-incidents.show', $incident);
    }

    public static function createDraftFromAlert(
        int $siteId,
        string $incidentType,
        string $title,
        ?int $alertId = null,
        ?int $rfidZoneId = null,
        ?int $cameraId = null,
    ): HseIncident {
        $site = Site::query()->findOrFail($siteId);

        return HseIncident::query()->create([
            'site_id' => $site->id,
            'incident_number' => app(UdpmWeeklyReportService::class)->nextIncidentNumber($site),
            'status' => 'pending_classification',
            'incident_type' => $incidentType,
            'occurred_at' => now(),
            'rfid_zone_id' => $rfidZoneId,
            'camera_id' => $cameraId,
            'alert_ids' => $alertId !== null ? [$alertId] : null,
            'classification' => ['draft_title' => $title],
        ]);
    }
}
