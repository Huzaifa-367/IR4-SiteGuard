<?php

namespace App\Support;

use App\Models\Alert;
use App\Models\AlertAction;
use App\Models\Camera;
use App\Models\DetectionEvent;
use App\Models\Investigation;
use App\Models\Rule;
use App\Models\Site;
use App\Models\SiteLocation;
use Illuminate\Database\Eloquent\Builder;

class SiteGuardAiDataService
{
    public function __construct(private Site $site) {}

    private function iot(): SiteGuardAiIotDataService
    {
        return new SiteGuardAiIotDataService($this->site);
    }

    /**
     * @return array<string, mixed>
     */
    public function overview(): array
    {
        $now = now();
        $siteId = $this->site->id;

        $alertsBase = Alert::query()->where('site_id', $siteId);
        $camerasBase = Camera::query()->where('site_id', $siteId);

        $openAlerts = (clone $alertsBase)->where('status', 'open')->count();
        $criticalOpen = (clone $alertsBase)->where('status', 'open')->where('severity', 'critical')->count();
        $highOpen = (clone $alertsBase)->where('status', 'open')->where('severity', 'high')->count();

        $byStatus = (clone $alertsBase)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();

        $bySeverityOpen = (clone $alertsBase)
            ->where('status', 'open')
            ->selectRaw('severity, count(*) as total')
            ->groupBy('severity')
            ->pluck('total', 'severity')
            ->all();

        $camerasTotal = (clone $camerasBase)->count();
        $camerasOnline = (clone $camerasBase)->where('health_status', 'online')->count();
        $camerasOffline = (clone $camerasBase)->where('health_status', 'offline')->count();
        $camerasDegraded = (clone $camerasBase)->where('health_status', 'degraded')->count();

        $events24h = DetectionEvent::query()
            ->where('site_id', $siteId)
            ->where('received_at', '>=', $now->copy()->subDay())
            ->count();

        $events7d = DetectionEvent::query()
            ->where('site_id', $siteId)
            ->where('received_at', '>=', $now->copy()->subDays(7))
            ->count();

        $openInvestigations = Investigation::query()
            ->where('site_id', $siteId)
            ->where('status', 'open')
            ->count();

        $activeRules = Rule::query()
            ->where('site_id', $siteId)
            ->where('is_active', true)
            ->count();

        $enabledModules = $this->site->detectionModules()
            ->wherePivot('is_enabled', true)
            ->count();

        return [
            'site' => [
                'id' => $this->site->id,
                'name' => $this->site->name,
                'code' => $this->site->code,
                'status' => $this->site->status,
                'timezone' => $this->site->timezone,
                'address' => $this->site->address,
            ],
            'alerts' => [
                'open' => $openAlerts,
                'critical_open' => $criticalOpen,
                'high_open' => $highOpen,
                'by_status' => $byStatus,
                'open_by_severity' => $bySeverityOpen,
            ],
            'cameras' => [
                'total' => $camerasTotal,
                'online' => $camerasOnline,
                'offline' => $camerasOffline,
                'degraded' => $camerasDegraded,
            ],
            'detection_events' => [
                'last_24_hours' => $events24h,
                'last_7_days' => $events7d,
            ],
            'investigations' => [
                'open' => $openInvestigations,
            ],
            'rules' => [
                'active' => $activeRules,
            ],
            'detection_modules' => [
                'enabled' => $enabledModules,
            ],
            'iot' => $this->iot()->summary(),
            'as_of' => $now->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function searchAlerts(
        ?string $status = null,
        ?string $severity = null,
        ?string $search = null,
        int $days = 14,
        int $limit = 25,
    ): array {
        $days = max(1, min($days, 90));
        $query = Alert::query()
            ->where('site_id', $this->site->id)
            ->with([
                'camera:id,name',
                'detectionModule:id,key,name',
                'rule:id,code,name',
                'assignedUser:id,name',
                'firstDetectionEvent.snapshot:id,storage_key',
            ])
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->when($severity, fn (Builder $q) => $q->where('severity', $severity))
            ->when($days > 0, fn (Builder $q) => $q->where('opened_at', '>=', now()->subDays($days)))
            ->when($search, function (Builder $q) use ($search): void {
                $term = '%'.addcslashes($search, '%_\\').'%';
                $q->where(function (Builder $inner) use ($term): void {
                    $inner->where('title', 'like', $term)
                        ->orWhereHas('camera', fn (Builder $c) => $c->where('name', 'like', $term))
                        ->orWhereHas('rule', fn (Builder $r) => $r->where('name', 'like', $term)->orWhere('code', 'like', $term));
                });
            })
            ->latest('opened_at')
            ->limit(min($limit, 50));

        $alerts = $query->get()->map(fn (Alert $alert): array => [
            'id' => $alert->id,
            'title' => $alert->title,
            'severity' => $alert->severity,
            'status' => $alert->status,
            'camera' => $alert->camera?->name,
            'module' => $alert->detectionModule?->name,
            'rule' => $alert->rule?->name,
            'assigned_to' => $alert->assignedUser?->name,
            'occurrence_count' => $alert->occurrence_count,
            'snapshot_url' => MediaObjectUrl::resolve($alert->firstDetectionEvent?->snapshot),
            'opened_at' => $alert->opened_at?->toIso8601String(),
            'closed_at' => $alert->closed_at?->toIso8601String(),
        ]);

        return [
            'count' => $alerts->count(),
            'alerts' => $alerts->all(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function alertDetails(int $alertId): ?array
    {
        $alert = Alert::query()
            ->where('site_id', $this->site->id)
            ->whereKey($alertId)
            ->with([
                'camera:id,name,health_status',
                'detectionModule:id,key,name',
                'rule:id,code,name,severity',
                'assignedUser:id,name',
                'firstDetectionEvent.snapshot:id,storage_key,captured_at',
                'actions' => fn ($q) => $q->with('user:id,name')->latest(),
            ])
            ->first();

        if ($alert === null) {
            return null;
        }

        return [
            'id' => $alert->id,
            'title' => $alert->title,
            'severity' => $alert->severity,
            'status' => $alert->status,
            'occurrence_count' => $alert->occurrence_count,
            'opened_at' => $alert->opened_at?->toIso8601String(),
            'closed_at' => $alert->closed_at?->toIso8601String(),
            'camera' => $alert->camera ? [
                'id' => $alert->camera->id,
                'name' => $alert->camera->name,
                'health_status' => $alert->camera->health_status,
            ] : null,
            'module' => $alert->detectionModule ? [
                'key' => $alert->detectionModule->key,
                'name' => $alert->detectionModule->name,
            ] : null,
            'rule' => $alert->rule ? [
                'code' => $alert->rule->code,
                'name' => $alert->rule->name,
                'severity' => $alert->rule->severity,
            ] : null,
            'assigned_to' => $alert->assignedUser?->name,
            'snapshot_url' => MediaObjectUrl::resolve($alert->firstDetectionEvent?->snapshot),
            'actions' => $alert->actions->map(fn (AlertAction $action): array => [
                'action' => $action->action,
                'reason_code' => $action->reason_code,
                'note' => $action->note,
                'user' => $action->user?->name,
                'at' => $action->created_at?->toIso8601String(),
            ])->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listCameras(?string $healthStatus = null, bool $activeOnly = true): array
    {
        $cameras = Camera::query()
            ->where('site_id', $this->site->id)
            ->with(['location:id,name', 'detectionModule:id,key,name'])
            ->when($activeOnly, fn (Builder $q) => $q->where('is_active', true))
            ->when($healthStatus, fn (Builder $q) => $q->where('health_status', $healthStatus))
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Camera $camera): array => [
                'id' => $camera->id,
                'name' => $camera->name,
                'code' => $camera->code,
                'health_status' => $camera->health_status,
                'is_active' => $camera->is_active,
                'location' => $camera->location?->name ?? $camera->location_label,
                'module' => $camera->detectionModule?->name,
                'last_ingest_at' => $camera->last_ingest_at?->toIso8601String(),
            ]);

        return [
            'count' => $cameras->count(),
            'cameras' => $cameras->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listInvestigations(?string $status = null, int $limit = 20): array
    {
        $investigations = Investigation::query()
            ->where('site_id', $this->site->id)
            ->with(['openedBy:id,name', 'assignedUser:id,name'])
            ->withCount('alerts')
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->latest('opened_at')
            ->limit(min($limit, 30))
            ->get()
            ->map(fn (Investigation $investigation): array => [
                'id' => $investigation->id,
                'title' => $investigation->title,
                'status' => $investigation->status,
                'description' => str($investigation->description)->limit(300)->toString(),
                'linked_alerts' => $investigation->alerts_count,
                'opened_by' => $investigation->openedBy?->name,
                'assigned_to' => $investigation->assignedUser?->name,
                'opened_at' => $investigation->opened_at?->toIso8601String(),
                'closed_at' => $investigation->closed_at?->toIso8601String(),
            ]);

        return [
            'count' => $investigations->count(),
            'investigations' => $investigations->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listRules(bool $activeOnly = false): array
    {
        $rules = Rule::query()
            ->where('site_id', $this->site->id)
            ->with('detectionModule:id,key,name')
            ->when($activeOnly, fn (Builder $q) => $q->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(fn (Rule $rule): array => [
                'id' => $rule->id,
                'code' => $rule->code,
                'name' => $rule->name,
                'severity' => $rule->severity,
                'is_active' => $rule->is_active,
                'module' => $rule->detectionModule?->name,
                'dwell_sec' => $rule->dwell_sec,
                'cooldown_sec' => $rule->cooldown_sec,
            ]);

        return [
            'count' => $rules->count(),
            'rules' => $rules->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listDetectionModules(): array
    {
        $modules = $this->site->detectionModules()
            ->orderBy('name')
            ->get()
            ->map(fn ($module): array => [
                'key' => $module->key,
                'name' => $module->name,
                'description' => $module->description,
                'is_enabled' => (bool) $module->pivot->is_enabled,
            ]);

        return [
            'count' => $modules->count(),
            'modules' => $modules->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function listLocations(): array
    {
        $locations = SiteLocation::query()
            ->where('site_id', $this->site->id)
            ->withCount('cameras')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (SiteLocation $location): array => [
                'id' => $location->id,
                'name' => $location->name,
                'code' => $location->code,
                'cameras_count' => $location->cameras_count,
            ]);

        return [
            'count' => $locations->count(),
            'locations' => $locations->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function searchDetectionEvents(
        int $days = 7,
        ?int $cameraId = null,
        ?string $moduleKey = null,
        int $limit = 30,
    ): array {
        $query = DetectionEvent::query()
            ->where('site_id', $this->site->id)
            ->with(['camera:id,name', 'detectionModule:id,key,name'])
            ->where('received_at', '>=', now()->subDays(max(1, min($days, 30))))
            ->when($cameraId, fn (Builder $q) => $q->where('camera_id', $cameraId))
            ->when($moduleKey, fn (Builder $q) => $q->whereHas(
                'detectionModule',
                fn (Builder $m) => $m->where('key', $moduleKey),
            ))
            ->latest('received_at')
            ->limit(min($limit, 50));

        $events = $query->get()->map(fn (DetectionEvent $event): array => [
            'id' => $event->id,
            'camera' => $event->camera?->name,
            'module' => $event->detectionModule?->name,
            'captured_at' => $event->captured_at?->toIso8601String(),
            'received_at' => $event->received_at?->toIso8601String(),
            'classes' => $event->classes,
            'model' => $event->model_name,
        ]);

        return [
            'count' => $events->count(),
            'events' => $events->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function alertTrend(int $days = 14): array
    {
        $days = max(1, min($days, 30));
        $start = now()->subDays($days - 1)->startOfDay();

        $rows = Alert::query()
            ->where('site_id', $this->site->id)
            ->where('opened_at', '>=', $start)
            ->selectRaw('DATE(opened_at) as day, severity, count(*) as total')
            ->groupBy('day', 'severity')
            ->orderBy('day')
            ->get();

        return [
            'days' => $days,
            'series' => $rows->map(fn ($row): array => [
                'day' => $row->day,
                'severity' => $row->severity,
                'total' => (int) $row->total,
            ])->all(),
        ];
    }
}
