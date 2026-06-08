<?php

namespace App\Support;

use App\Models\Alert;
use App\Models\AlertAction;
use App\Models\Camera;
use App\Models\DetectionEvent;
use App\Models\DetectionModule;
use App\Models\Site;
use App\Models\User;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DashboardAnalytics
{
    /**
     * @return Collection<int, int>
     */
    public function siteIdsForDashboard(Request $request, SelectedSiteManager $selectedSiteManager): Collection
    {
        $user = $request->user();

        if ($user === null) {
            return collect();
        }

        $selectedSite = $selectedSiteManager->resolveSelectedSite($request);

        if ($selectedSite !== null) {
            return collect([$selectedSite->id]);
        }

        return $selectedSiteManager->accessibleSites($user)->pluck('id');
    }

    /**
     * @return array<string, mixed>
     */
    public function build(Request $request, SelectedSiteManager $selectedSiteManager): array
    {
        $siteIds = $this->siteIdsForDashboard($request, $selectedSiteManager);
        $user = $request->user();
        $scopeLabel = $this->scopeLabel($request, $selectedSiteManager, $siteIds);
        $now = now();

        return [
            'scopeLabel' => $scopeLabel,
            'updatedAt' => $now->toIso8601String(),
            'kpis' => $this->kpis($siteIds, $now),
            'criticalAlerts' => $this->criticalAlerts($siteIds),
            'alertsByModule' => $this->alertsByModule($siteIds, $now),
            'alertsBySeverity' => $this->alertsBySeverity($siteIds),
            'siteHealthScores' => $this->siteHealthScores($siteIds, $user),
            'alertHeatmap' => $this->alertHeatmap($siteIds, $now),
            'camerasNeedingAttention' => $this->camerasNeedingAttention($siteIds),
            'trend' => $this->trend($siteIds, $now),
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function scopeLabel(
        Request $request,
        SelectedSiteManager $selectedSiteManager,
        Collection $siteIds,
    ): string {
        $selectedSite = $selectedSiteManager->resolveSelectedSite($request);

        if ($selectedSite !== null) {
            return $selectedSite->name;
        }

        if ($siteIds->count() === 1) {
            $site = Site::query()->find($siteIds->first());

            return $site?->name ?? 'All sites';
        }

        return 'All sites';
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array<string, mixed>>
     */
    private function kpis(Collection $siteIds, CarbonInterface $now): array
    {
        $openNow = $this->alertsQuery($siteIds)->where('status', 'open')->count();
        $criticalNow = $this->alertsQuery($siteIds)
            ->where('status', 'open')
            ->where('severity', 'critical')
            ->count();
        $criticalYesterday = $this->alertsQuery($siteIds)
            ->where('status', 'open')
            ->where('severity', 'critical')
            ->where('opened_at', '<', $now->copy()->subDay())
            ->count();

        $camerasTotal = $this->camerasQuery($siteIds)->count();
        $camerasOnline = $this->camerasQuery($siteIds)->where('health_status', 'online')->count();
        $onlinePct = $camerasTotal > 0 ? (int) round(($camerasOnline / $camerasTotal) * 100) : 0;

        $avgAckMinutes = $this->averageAcknowledgeMinutes($siteIds, $now);
        $fpRate = $this->falsePositiveRate($siteIds, $now);

        $openSparkline = $this->dailyOpenAlertCounts($siteIds, $now, 14);
        $events24h = DetectionEvent::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('received_at', '>=', $now->copy()->subDay())
            ->count();

        return [
            [
                'key' => 'open_alerts',
                'label' => 'Open alerts',
                'value' => $openNow,
                'hint' => 'Last 24h activity',
                'delta' => null,
                'deltaLabel' => null,
                'sparkline' => $openSparkline,
            ],
            [
                'key' => 'critical_open',
                'label' => 'Critical open',
                'value' => $criticalNow,
                'hint' => 'vs yesterday',
                'delta' => $criticalNow - $criticalYesterday,
                'deltaLabel' => 'vs prior day',
                'sparkline' => $this->dailyCriticalOpenCounts($siteIds, $now, 14),
            ],
            [
                'key' => 'cameras_online',
                'label' => 'Cameras online',
                'value' => $camerasOnline,
                'hint' => "{$onlinePct}% up · {$camerasTotal} total",
                'delta' => null,
                'deltaLabel' => null,
                'sparkline' => [],
            ],
            [
                'key' => 'avg_ack',
                'label' => 'Avg ack time',
                'value' => $avgAckMinutes !== null ? "{$avgAckMinutes} min" : '—',
                'hint' => 'Rolling 7 days',
                'delta' => null,
                'deltaLabel' => 'target 15m',
                'sparkline' => [],
            ],
            [
                'key' => 'fp_rate',
                'label' => 'FP rate',
                'value' => $fpRate !== null ? "{$fpRate}%" : '—',
                'hint' => 'Dismissed last 7d',
                'delta' => null,
                'deltaLabel' => 'target <20%',
                'sparkline' => [],
            ],
            [
                'key' => 'events_24h',
                'label' => 'Events / 24h',
                'value' => $events24h,
                'hint' => 'Detection ingest',
                'delta' => null,
                'deltaLabel' => null,
                'sparkline' => $this->dailyEventCounts($siteIds, $now, 14),
            ],
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array<string, mixed>>
     */
    private function criticalAlerts(Collection $siteIds): array
    {
        return $this->alertsQuery($siteIds)
            ->with(['site:id,name', 'camera:id,name', 'detectionModule:id,key,name'])
            ->where('status', 'open')
            ->whereIn('severity', ['critical', 'high'])
            ->latest('opened_at')
            ->limit(6)
            ->get()
            ->map(fn (Alert $alert): array => [
                'id' => $alert->id,
                'title' => $alert->title,
                'severity' => $alert->severity,
                'site' => $alert->site?->name,
                'camera' => $alert->camera?->name,
                'module_key' => $alert->detectionModule?->key,
                'module_name' => $alert->detectionModule?->name,
                'opened_at' => $alert->opened_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array{module: string, key: string, count: int, color: string}>
     */
    private function alertsByModule(Collection $siteIds, CarbonInterface $now): array
    {
        $since = $now->copy()->subDays(7);
        $modules = DetectionModule::query()->orderBy('name')->get(['id', 'key', 'name']);
        $counts = $this->alertsQuery($siteIds)
            ->where('opened_at', '>=', $since)
            ->select('detection_module_id', DB::raw('count(*) as total'))
            ->groupBy('detection_module_id')
            ->pluck('total', 'detection_module_id');

        return $modules->map(fn (DetectionModule $module): array => [
            'module' => $module->name,
            'key' => $module->key,
            'count' => (int) ($counts[$module->id] ?? 0),
            'color' => $this->moduleColor($module->key),
        ])->values()->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array{severity: string, count: int, color: string}>
     */
    private function alertsBySeverity(Collection $siteIds): array
    {
        $counts = $this->alertsQuery($siteIds)
            ->where('status', 'open')
            ->select('severity', DB::raw('count(*) as total'))
            ->groupBy('severity')
            ->pluck('total', 'severity');

        $order = ['critical', 'high', 'medium', 'low'];

        return collect($order)->map(fn (string $severity): array => [
            'severity' => $severity,
            'count' => (int) ($counts[$severity] ?? 0),
            'color' => $this->severityColor($severity),
        ])->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array<string, mixed>>
     */
    private function siteHealthScores(Collection $siteIds, ?User $user): array
    {
        $sitesQuery = Site::query()->where('status', 'active')->orderBy('name');

        if ($user !== null && ! $user->can('sites.access_all') && ! $user->hasRole('super_admin')) {
            $sitesQuery->whereIn('id', $user->sites()->pluck('sites.id'));
        } elseif ($siteIds->isNotEmpty()) {
            $sitesQuery->whereIn('id', $siteIds);
        }

        $sites = $sitesQuery->get(['id', 'name']);
        $priorWeekStart = now()->subDays(14);
        $priorWeekEnd = now()->subDays(7);
        $currentWeekStart = now()->subDays(7);

        return $sites->map(function (Site $site) use ($priorWeekStart, $priorWeekEnd, $currentWeekStart): array {
            $siteId = collect([$site->id]);
            $score = $this->computeSiteHealthScore($siteId, $currentWeekStart, now());
            $priorScore = $this->computeSiteHealthScore($siteId, $priorWeekStart, $priorWeekEnd);
            $camerasTotal = $this->camerasQuery($siteId)->count();
            $camerasOnline = $this->camerasQuery($siteId)->where('health_status', 'online')->count();

            return [
                'id' => $site->id,
                'name' => $site->name,
                'score' => $score,
                'delta' => $score - $priorScore,
                'open_alerts' => $this->alertsQuery($siteId)->where('status', 'open')->count(),
                'cameras_online' => $camerasOnline,
                'cameras_total' => $camerasTotal,
            ];
        })->sortByDesc('score')->values()->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{days: list<string>, hours: list<int>, cells: list<array{day: string, hour: int, count: int}>}
     */
    private function alertHeatmap(Collection $siteIds, CarbonInterface $now): array
    {
        $since = $now->copy()->subDays(7)->startOfDay();
        $rows = $this->alertsQuery($siteIds)
            ->where('opened_at', '>=', $since)
            ->get(['opened_at']);

        $days = collect(CarbonPeriod::create($since, '1 day', $now->copy()->startOfDay()))
            ->map(fn (CarbonInterface $day): string => $day->format('D'))
            ->values()
            ->all();

        $cells = [];
        $counts = [];

        foreach ($rows as $alert) {
            if ($alert->opened_at === null) {
                continue;
            }
            $key = sprintf('%s-%02d', $alert->opened_at->format('Y-m-d'), (int) $alert->opened_at->format('G'));
            $counts[$key] = ($counts[$key] ?? 0) + 1;
        }

        foreach (CarbonPeriod::create($since, '1 day', $now->copy()->startOfDay()) as $day) {
            for ($hour = 0; $hour < 24; $hour++) {
                $key = sprintf('%s-%02d', $day->format('Y-m-d'), $hour);
                $cells[] = [
                    'day' => $day->format('D'),
                    'hour' => $hour,
                    'count' => $counts[$key] ?? 0,
                ];
            }
        }

        $max = max(1, ...array_column($cells, 'count'));

        return [
            'days' => $days,
            'hours' => range(0, 23),
            'cells' => $cells,
            'max' => $max,
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array<string, mixed>>
     */
    private function camerasNeedingAttention(Collection $siteIds): array
    {
        return $this->camerasQuery($siteIds)
            ->with('site:id,name')
            ->whereIn('health_status', ['offline', 'degraded'])
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn (Camera $camera): array => [
                'id' => $camera->id,
                'name' => $camera->name,
                'site' => $camera->site?->name,
                'health_status' => $camera->health_status,
                'last_ingest_at' => $camera->last_ingest_at?->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, events: list<int>, acknowledged: list<int>}
     */
    private function trend(Collection $siteIds, CarbonInterface $now): array
    {
        $labels = [];
        $events = [];
        $acknowledged = [];

        for ($i = 13; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i)->startOfDay();
            $next = $day->copy()->addDay();
            $labels[] = $day->format('M j');

            $events[] = DetectionEvent::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->whereBetween('received_at', [$day, $next])
                ->count();

            $acknowledged[] = AlertAction::query()
                ->where('action', 'acknowledge')
                ->whereBetween('created_at', [$day, $next])
                ->whereHas('alert', function (Builder $q) use ($siteIds): void {
                    if ($siteIds->isNotEmpty()) {
                        $q->whereIn('site_id', $siteIds);
                    }
                })
                ->count();
        }

        return [
            'labels' => $labels,
            'events' => $events,
            'acknowledged' => $acknowledged,
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return list<int>
     */
    private function dailyOpenAlertCounts(Collection $siteIds, CarbonInterface $now, int $days): array
    {
        $points = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i)->startOfDay();
            $next = $day->copy()->addDay();
            $points[] = $this->alertsQuery($siteIds)
                ->where('status', 'open')
                ->where('opened_at', '<', $next)
                ->where(function (Builder $q) use ($day): void {
                    $q->whereNull('closed_at')->orWhere('closed_at', '>=', $day);
                })
                ->count();
        }

        return $points;
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return list<int>
     */
    private function dailyCriticalOpenCounts(Collection $siteIds, CarbonInterface $now, int $days): array
    {
        $points = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i)->startOfDay();
            $points[] = $this->alertsQuery($siteIds)
                ->where('severity', 'critical')
                ->whereDate('opened_at', $day)
                ->count();
        }

        return $points;
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return list<int>
     */
    private function dailyEventCounts(Collection $siteIds, CarbonInterface $now, int $days): array
    {
        $points = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i)->startOfDay();
            $next = $day->copy()->addDay();
            $points[] = DetectionEvent::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->whereBetween('received_at', [$day, $next])
                ->count();
        }

        return $points;
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function averageAcknowledgeMinutes(Collection $siteIds, CarbonInterface $now): ?int
    {
        $since = $now->copy()->subDays(7);

        $actions = AlertAction::query()
            ->where('action', 'acknowledge')
            ->where('created_at', '>=', $since)
            ->with('alert:id,opened_at,site_id')
            ->whereHas('alert', function (Builder $q) use ($siteIds): void {
                if ($siteIds->isNotEmpty()) {
                    $q->whereIn('site_id', $siteIds);
                }
            })
            ->get();

        if ($actions->isEmpty()) {
            return null;
        }

        $totalMinutes = $actions->sum(function (AlertAction $action): int {
            if ($action->alert?->opened_at === null) {
                return 0;
            }

            return (int) $action->alert->opened_at->diffInMinutes($action->created_at);
        });

        return (int) round($totalMinutes / $actions->count());
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function falsePositiveRate(Collection $siteIds, CarbonInterface $now): ?int
    {
        $since = $now->copy()->subDays(7);

        $dismissed = $this->alertsQuery($siteIds)
            ->where('status', 'dismissed')
            ->where('updated_at', '>=', $since)
            ->count();

        if ($dismissed === 0) {
            return null;
        }

        $falsePositives = AlertAction::query()
            ->where('action', 'dismiss')
            ->where(function (Builder $q): void {
                $q->where('reason_code', 'false_positive')
                    ->orWhere('note', 'like', '%false positive%');
            })
            ->where('created_at', '>=', $since)
            ->whereHas('alert', function (Builder $q) use ($siteIds): void {
                if ($siteIds->isNotEmpty()) {
                    $q->whereIn('site_id', $siteIds);
                }
            })
            ->distinct('alert_id')
            ->count('alert_id');

        return (int) round(($falsePositives / $dismissed) * 100);
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return Builder<Alert>
     */
    private function alertsQuery(Collection $siteIds): Builder
    {
        return Alert::query()->when(
            $siteIds->isNotEmpty(),
            fn (Builder $q) => $q->whereIn('site_id', $siteIds),
        );
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return Builder<Camera>
     */
    private function camerasQuery(Collection $siteIds): Builder
    {
        return Camera::query()
            ->where('is_active', true)
            ->when(
                $siteIds->isNotEmpty(),
                fn (Builder $q) => $q->whereIn('site_id', $siteIds),
            );
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function computeSiteHealthScore(
        Collection $siteIds,
        CarbonInterface $periodStart,
        CarbonInterface $periodEnd,
    ): int {
        $criticalOpen = $this->alertsQuery($siteIds)
            ->where('status', 'open')
            ->where('severity', 'critical')
            ->count();
        $camerasTotal = $this->camerasQuery($siteIds)->count();
        $camerasOnline = $this->camerasQuery($siteIds)->where('health_status', 'online')->count();
        $cameraPct = $camerasTotal > 0 ? $camerasOnline / $camerasTotal : 1;

        $priorVolume = DetectionEvent::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->whereBetween('received_at', [$periodStart, $periodEnd])
            ->count();

        $alertVolume = $this->alertsQuery($siteIds)
            ->whereBetween('opened_at', [$periodStart, $periodEnd])
            ->count();

        $score = (int) round(100
            - min(30, $criticalOpen * 8)
            - (1 - $cameraPct) * 25
            - min(15, $alertVolume > 0 ? min(15, $priorVolume / max(1, $alertVolume)) : 0));

        return max(0, min(100, $score));
    }

    private function moduleColor(string $key): string
    {
        return match ($key) {
            'ppe' => '#F59E0B',
            'vehicle_proximity' => '#3B82F6',
            'working_at_height' => '#8B5CF6',
            default => '#64748B',
        };
    }

    private function severityColor(string $severity): string
    {
        return match ($severity) {
            'critical' => '#EF4444',
            'high' => '#F97316',
            'medium' => '#EAB308',
            default => '#64748B',
        };
    }
}
