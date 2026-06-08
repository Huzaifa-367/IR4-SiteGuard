<?php

namespace App\Support;

use App\Models\EdgeDevice;
use App\Models\EquipmentAsset;
use App\Models\EquipmentInspection;
use App\Models\GasGateway;
use App\Models\GasReading;
use App\Models\GateEntryExitLog;
use App\Models\HseIncident;
use App\Models\LsrViolationLog;
use App\Models\RfidReader;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\SensorAlarm;
use App\Models\SensorDevice;
use App\Models\SensorReading;
use App\Models\Site;
use App\Models\UdpmWeeklyReport;
use App\Models\User;
use App\Models\WorkerRecord;
use App\Support\Iot\IotTimeRange;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class IotAnalytics
{
    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<string, mixed>|null
     */
    public function dashboardSnapshot(Collection $siteIds, ?User $user, int $chartDays = 90): ?array
    {
        if ($siteIds->isEmpty() || $user === null) {
            return null;
        }

        $canRfid = $user->can('rfid.view') || $user->can('gate_log.view');
        $canGas = $user->can('gas.view') || $user->can('environmental.view');

        if (! $canRfid && ! $canGas) {
            return null;
        }

        return [
            'kpis' => $this->kpis($siteIds, $canRfid, $canGas),
            'gasTrend' => $canGas ? $this->gasTrend($siteIds, 24) : null,
            'co2Trend' => $canGas ? $this->co2Trend($siteIds, 24) : null,
            'gateFlow' => $canRfid ? $this->gateFlow($siteIds, $chartDays) : null,
            'zoneOccupancy' => $canRfid ? $this->zoneOccupancy($siteIds) : null,
            'deviceHealth' => $this->deviceHealthBreakdown($siteIds),
            'activeAlarms' => $canGas ? $this->activeAlarms($siteIds) : [],
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function gasPageAnalytics(int $siteId, int $chartDays = 90, int $selectedDays = 90): array
    {
        $siteIds = collect([$siteId]);
        $site = Site::query()->find($siteId);
        $thresholds = $site?->settings['gas_thresholds'] ?? config('siteguard.gas_thresholds');
        $hourlyHours = IotTimeRange::hourlyTrendHours($selectedDays);

        return [
            'summary' => $this->gasSummary($siteIds, $selectedDays),
            'gasTrend' => $this->gasTrend($siteIds, $hourlyHours),
            'gasTrendDaily' => $this->gasTrendDaily($siteIds, $chartDays),
            'co2Trend' => $this->co2Trend($siteIds, $hourlyHours),
            'environmentalTrend' => $this->environmentalTrend($siteIds, $hourlyHours),
            'lelByGateway' => $this->latestGasByGateway($siteId, $selectedDays),
            'alarmHistory' => $this->alarmHistory($siteIds, $chartDays),
            'thresholds' => $thresholds,
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function rfidPageAnalytics(int $siteId, int $chartDays = 90, int $selectedDays = 90): array
    {
        $siteIds = collect([$siteId]);
        $site = Site::query()->find($siteId);
        $hourlyHours = IotTimeRange::hourlyTrendHours($selectedDays);

        return [
            'gateFlow' => $this->gateFlow($siteIds, $chartDays),
            'gateFlowHourly' => $this->gateFlowHourly($siteIds, $hourlyHours),
            'zoneOccupancy' => $this->zoneOccupancy($siteIds),
            'contractorBreakdown' => $this->contractorBreakdown($siteId, $selectedDays),
            'rfidSummary' => $this->rfidSummary($siteIds),
            'zoneMapPins' => $this->zoneMapPins($siteIds, $site),
            'siteMapCenter' => $site?->map_center_lat !== null && $site?->map_center_lng !== null
                ? ['lat' => (float) $site->map_center_lat, 'lng' => (float) $site->map_center_lng]
                : null,
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function fieldDevicesAnalytics(int $siteId, int $chartDays = 90): array
    {
        $siteIds = collect([$siteId]);

        return [
            'deviceHealth' => $this->deviceHealthBreakdown($siteIds),
            'healthByType' => $this->healthByTypeChart($siteId),
            'inventorySummary' => $this->fieldDevicesInventorySummary($siteId),
            'tokenSummary' => $this->ingestTokenSummary($siteId),
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array<string, mixed>>
     */
    private function kpis(Collection $siteIds, bool $canRfid, bool $canGas): array
    {
        $kpis = [];

        if ($canRfid) {
            $onSite = RfidTagLastSeen::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('is_on_site', true)
                ->count();

            $entriesToday = GateEntryExitLog::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('direction', 'entry')
                ->where('occurred_at', '>=', now()->startOfDay())
                ->count();

            $kpis[] = [
                'key' => 'on_site',
                'label' => 'On site now',
                'value' => $onSite,
                'hint' => 'RFID headcount',
            ];
            $kpis[] = [
                'key' => 'gate_entries',
                'label' => 'Gate entries today',
                'value' => $entriesToday,
                'hint' => 'Instrumented',
            ];
        }

        if ($canGas) {
            $activeAlarms = SensorAlarm::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->whereNull('cleared_at')
                ->count();

            $readings24h = GasReading::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('read_at', '>=', now()->subDay())
                ->count();

            $kpis[] = [
                'key' => 'sensor_alarms',
                'label' => 'Active sensor alarms',
                'value' => $activeAlarms,
                'hint' => 'Gas & environmental',
            ];
            $kpis[] = [
                'key' => 'gas_readings',
                'label' => 'Gas readings / 24h',
                'value' => $readings24h,
                'hint' => 'All gateways',
            ];
        }

        $devicesOnline = $this->devicesOnlineCount($siteIds);
        $devicesTotal = $this->devicesTotalCount($siteIds);

        $kpis[] = [
            'key' => 'devices_online',
            'label' => 'IoT devices online',
            'value' => $devicesOnline,
            'hint' => "{$devicesTotal} registered",
        ];

        return $kpis;
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, lel: list<float|null>, o2: list<float|null>, h2s: list<float|null>, co: list<float|null>}
     */
    public function gasTrend(Collection $siteIds, int $hours): array
    {
        $labels = [];
        $lel = [];
        $o2 = [];
        $h2s = [];
        $co = [];

        for ($i = $hours - 1; $i >= 0; $i--) {
            $start = now()->subHours($i)->startOfHour();
            $end = $start->copy()->addHour();
            $labels[] = $start->format('H:i');

            $row = GasReading::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->whereBetween('read_at', [$start, $end])
                ->selectRaw('AVG(lel_pct) as lel_avg, AVG(o2_pct) as o2_avg, AVG(h2s_ppm) as h2s_avg, AVG(co_ppm) as co_avg')
                ->first();

            $lel[] = $row?->lel_avg !== null ? round((float) $row->lel_avg, 2) : null;
            $o2[] = $row?->o2_avg !== null ? round((float) $row->o2_avg, 2) : null;
            $h2s[] = $row?->h2s_avg !== null ? round((float) $row->h2s_avg, 2) : null;
            $co[] = $row?->co_avg !== null ? round((float) $row->co_avg, 2) : null;
        }

        return compact('labels', 'lel', 'o2', 'h2s', 'co');
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, values: list<float|null>}
     */
    public function co2Trend(Collection $siteIds, int $hours): array
    {
        $labels = [];
        $values = [];

        for ($i = $hours - 1; $i >= 0; $i--) {
            $start = now()->subHours($i)->startOfHour();
            $end = $start->copy()->addHour();
            $labels[] = $start->format('H:i');

            $avg = SensorReading::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('parameter', 'co2_ppm')
                ->whereBetween('read_at', [$start, $end])
                ->avg('value');

            $values[] = $avg !== null ? round((float) $avg, 1) : null;
        }

        return ['labels' => $labels, 'values' => $values];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, entries: list<int>, exits: list<int>}
     */
    public function gateFlow(Collection $siteIds, int $days): array
    {
        $since = now()->subDays(max($days - 1, 0))->startOfDay();
        $dateExpr = IotTimeRange::dateBucketExpression('occurred_at');

        $entriesByDay = GateEntryExitLog::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('direction', 'entry')
            ->where('occurred_at', '>=', $since)
            ->selectRaw("{$dateExpr} as bucket, COUNT(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        $exitsByDay = GateEntryExitLog::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('direction', 'exit')
            ->where('occurred_at', '>=', $since)
            ->selectRaw("{$dateExpr} as bucket, COUNT(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->rollupDualCountSeries($since, now()->endOfDay(), $days, $entriesByDay, $exitsByDay);
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, entries: list<int>, exits: list<int>}
     */
    public function gateFlowHourly(Collection $siteIds, int $hours): array
    {
        $labels = [];
        $entries = [];
        $exits = [];

        for ($i = $hours - 1; $i >= 0; $i--) {
            $start = now()->subHours($i)->startOfHour();
            $end = $start->copy()->addHour();
            $labels[] = $start->format('H:i');

            $entries[] = GateEntryExitLog::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('direction', 'entry')
                ->whereBetween('occurred_at', [$start, $end])
                ->count();

            $exits[] = GateEntryExitLog::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('direction', 'exit')
                ->whereBetween('occurred_at', [$start, $end])
                ->count();
        }

        return compact('labels', 'entries', 'exits');
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array{zone: string, count: int, max: int|null, utilization: float|null}>
     */
    public function zoneOccupancy(Collection $siteIds): array
    {
        $zones = RfidZone::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'max_occupancy']);

        return $zones->map(function (RfidZone $zone) use ($siteIds): array {
            $count = RfidTagLastSeen::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                ->where('rfid_zone_id', $zone->id)
                ->where('is_on_site', true)
                ->count();

            $max = $zone->max_occupancy;

            return [
                'zone' => $zone->name,
                'count' => $count,
                'max' => $max,
                'utilization' => $max !== null && $max > 0 ? round(($count / $max) * 100, 1) : null,
            ];
        })->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array{type: string, online: int, offline: int, degraded: int, total: int}>
     */
    public function deviceHealthBreakdown(Collection $siteIds): array
    {
        $types = [
            ['label' => 'Edge', 'model' => EdgeDevice::class],
            ['label' => 'RFID', 'model' => RfidReader::class],
            ['label' => 'Gas', 'model' => GasGateway::class],
            ['label' => 'Sensors', 'model' => SensorDevice::class],
        ];

        return collect($types)->map(function (array $type) use ($siteIds): array {
            /** @var Builder $query */
            $query = $type['model']::query()
                ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds));

            $total = (clone $query)->count();
            $online = (clone $query)->where('health_status', 'online')->count();
            $offline = (clone $query)->where('health_status', 'offline')->count();
            $degraded = (clone $query)->where('health_status', 'degraded')->count();

            return [
                'type' => $type['label'],
                'online' => $online,
                'offline' => $offline,
                'degraded' => $degraded,
                'total' => $total,
            ];
        })->all();
    }

    /**
     * @return array<int, array{type: string, online: int, offline: int}>
     */
    public function healthByTypeChart(int $siteId): array
    {
        $siteIds = collect([$siteId]);

        return collect($this->deviceHealthBreakdown($siteIds))->map(fn (array $row): array => [
            'type' => $row['type'],
            'online' => $row['online'],
            'offline' => $row['offline'] + $row['degraded'],
        ])->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array{parameter: string, value: float|string, threshold: float|string, severity: string, alarm_at: string}>
     */
    public function activeAlarms(Collection $siteIds): array
    {
        return SensorAlarm::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->whereNull('cleared_at')
            ->orderByDesc('alarm_at')
            ->limit(6)
            ->get()
            ->map(fn (SensorAlarm $alarm): array => [
                'parameter' => $alarm->parameter,
                'value' => $alarm->value,
                'threshold' => $alarm->threshold,
                'severity' => $alarm->severity,
                'alarm_at' => $alarm->alarm_at->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, counts: list<int>}
     */
    public function alarmHistory(Collection $siteIds, int $days): array
    {
        $since = now()->subDays(max($days - 1, 0))->startOfDay();
        $dateExpr = IotTimeRange::dateBucketExpression('alarm_at');

        $countsByDay = SensorAlarm::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('alarm_at', '>=', $since)
            ->selectRaw("{$dateExpr} as bucket, COUNT(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->rollupCountSeries($since, now()->endOfDay(), $days, $countsByDay);
    }

    /**
     * @return array<int, array{gateway: string, lel_pct: float|string|null, o2_pct: float|string|null, h2s_ppm: float|string|null, co_ppm: float|string|null, alarm_state: string|null}>
     */
    public function latestGasByGateway(int $siteId, int $selectedDays = 90): array
    {
        $gatewayQuery = GasGateway::query()
            ->where('site_id', $siteId)
            ->orderBy('code');

        if ($selectedDays !== 0) {
            $since = IotTimeRange::since($selectedDays);

            if ($since !== null) {
                $gatewayQuery->whereHas('gasReadings', fn (Builder $q) => $q->where('read_at', '>=', $since));
            }
        }

        return $gatewayQuery
            ->get()
            ->map(function (GasGateway $gateway) use ($siteId, $selectedDays): array {
                $latestQuery = GasReading::query()
                    ->where('site_id', $siteId)
                    ->where('gas_gateway_id', $gateway->id);

                IotTimeRange::applySince($latestQuery, 'read_at', $selectedDays);

                $latest = $latestQuery->orderByDesc('read_at')->first();

                return [
                    'gateway' => $gateway->name,
                    'vehicle_label' => $gateway->vehicle_label,
                    'lel_pct' => $latest?->lel_pct,
                    'o2_pct' => $latest?->o2_pct,
                    'h2s_ppm' => $latest?->h2s_ppm,
                    'co_ppm' => $latest?->co_ppm,
                    'alarm_state' => $latest?->alarm_state,
                ];
            })
            ->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, lel: list<float|null>, o2: list<float|null>, h2s: list<float|null>, co: list<float|null>}
     */
    public function gasTrendDaily(Collection $siteIds, int $days): array
    {
        $since = now()->subDays(max($days - 1, 0))->startOfDay();
        $dateExpr = IotTimeRange::dateBucketExpression('read_at');

        $rowsByDay = GasReading::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('read_at', '>=', $since)
            ->selectRaw("{$dateExpr} as bucket, AVG(lel_pct) as lel_avg, AVG(o2_pct) as o2_avg, AVG(h2s_ppm) as h2s_avg, AVG(co_ppm) as co_avg")
            ->groupBy('bucket')
            ->get()
            ->keyBy('bucket');

        return $this->rollupGasDailySeries($since, now()->endOfDay(), $days, $rowsByDay);
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{labels: list<string>, temp: list<float|null>, humidity: list<float|null>, wind: list<float|null>}
     */
    public function environmentalTrend(Collection $siteIds, int $hours): array
    {
        $labels = [];
        $temp = [];
        $humidity = [];
        $wind = [];

        for ($i = $hours - 1; $i >= 0; $i--) {
            $start = now()->subHours($i)->startOfHour();
            $end = $start->copy()->addHour();
            $labels[] = $start->format('H:i');

            $temp[] = $this->hourlyAvg($siteIds, 'temp_c', $start, $end);
            $humidity[] = $this->hourlyAvg($siteIds, 'humidity_pct', $start, $end);
            $wind[] = $this->hourlyAvg($siteIds, 'wind_speed_mps', $start, $end);
        }

        return compact('labels', 'temp', 'humidity', 'wind');
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{on_site: int, stale_tags: int, stationary_tags: int, portable_approved: int, portable_pending: int}
     */
    public function rfidSummary(Collection $siteIds): array
    {
        $staleThreshold = now()->subSeconds((int) config('siteguard.rfid_stale_threshold_seconds', 1800));
        $stationaryThreshold = now()->subSeconds((int) config('siteguard.rfid_stationary_min_seconds', 1200));

        $onSiteQuery = RfidTagLastSeen::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('is_on_site', true);

        $staleTags = (clone $onSiteQuery)->where('last_seen_at', '<', $staleThreshold)->count();
        $stationaryTags = (clone $onSiteQuery)
            ->whereNotNull('stationary_since')
            ->where('stationary_since', '<=', $stationaryThreshold)
            ->count();

        $workersQuery = WorkerRecord::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('is_active', true);

        return [
            'on_site' => (clone $onSiteQuery)->count(),
            'stale_tags' => $staleTags,
            'stationary_tags' => $stationaryTags,
            'portable_approved' => (clone $workersQuery)->where('portable_device_approved', true)->count(),
            'portable_pending' => (clone $workersQuery)->where('portable_device_approved', false)->count(),
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array<int, array{id: int, name: string, code: string, zone_type: string, count: int, lat: float|null, lng: float|null}>
     */
    public function zoneMapPins(Collection $siteIds, ?Site $site = null): array
    {
        if ($site === null && $siteIds->count() === 1) {
            $site = Site::query()->find($siteIds->first());
        }

        return RfidZone::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (RfidZone $zone) use ($siteIds, $site): array {
                $count = RfidTagLastSeen::query()
                    ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
                    ->where('rfid_zone_id', $zone->id)
                    ->where('is_on_site', true)
                    ->count();

                [$lat, $lng] = $this->resolveZoneMapCoordinates($zone, $site);

                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'code' => $zone->code,
                    'zone_type' => $zone->zone_type,
                    'count' => $count,
                    'lat' => $lat,
                    'lng' => $lng,
                ];
            })
            ->all();
    }

    /**
     * @return array{0: float|null, 1: float|null}
     */
    public function resolveZoneMapCoordinates(RfidZone $zone, ?Site $site): array
    {
        if ($zone->map_pin_lat === null || $zone->map_pin_lng === null) {
            return [null, null];
        }

        $lat = (float) $zone->map_pin_lat;
        $lng = (float) $zone->map_pin_lng;

        if ($this->isRelativeSitePlanCoordinate($lat, $lng)
            && $site?->map_center_lat !== null
            && $site?->map_center_lng !== null) {
            $centerLat = (float) $site->map_center_lat;
            $centerLng = (float) $site->map_center_lng;
            $spanLat = 0.0035;
            $spanLng = $spanLat / max(cos(deg2rad($centerLat)), 0.2);

            return [
                $centerLat + ($lat - 0.5) * 2 * $spanLat,
                $centerLng + ($lng - 0.5) * 2 * $spanLng,
            ];
        }

        return [$lat, $lng];
    }

    private function isRelativeSitePlanCoordinate(float $lat, float $lng): bool
    {
        return abs($lat) <= 1.0 && abs($lng) <= 1.0;
    }

    /**
     * @return array<string, mixed>
     */
    public function equipmentPageAnalytics(int $siteId, int $chartDays = 90, int $selectedDays = 90): array
    {
        $byTypeQuery = EquipmentAsset::query()->where('site_id', $siteId);
        IotTimeRange::applySince($byTypeQuery, 'registered_at', $selectedDays);

        $byType = (clone $byTypeQuery)
            ->selectRaw('equipment_type, count(*) as total')
            ->groupBy('equipment_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->equipment_type,
                'count' => (int) $row->total,
            ])
            ->all();

        $byStatusQuery = EquipmentAsset::query()->where('site_id', $siteId);
        IotTimeRange::applySince($byStatusQuery, 'registered_at', $selectedDays);

        $byStatus = $byStatusQuery
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->status,
                'count' => (int) $row->total,
            ])
            ->all();

        return [
            'byType' => $byType,
            'byStatus' => $byStatus,
            'timeline' => $this->eventTimeline(
                EquipmentInspection::query()
                    ->whereHas('equipmentAsset', fn (Builder $q) => $q->where('site_id', $siteId)),
                'inspected_at',
                $chartDays,
            ),
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function lsrPageAnalytics(int $siteId, int $chartDays = 90): array
    {
        return [
            'timeline' => $this->eventTimeline(
                LsrViolationLog::query()->where('site_id', $siteId),
                'occurred_at',
                $chartDays,
            ),
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function hsePageAnalytics(int $siteId, int $chartDays = 90, int $selectedDays = 90): array
    {
        $byTypeQuery = HseIncident::query()->where('site_id', $siteId);
        IotTimeRange::applySince($byTypeQuery, 'occurred_at', $selectedDays);

        $byType = (clone $byTypeQuery)
            ->selectRaw('incident_type, count(*) as total')
            ->groupBy('incident_type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) ($row->incident_type ?? 'unknown'),
                'count' => (int) $row->total,
            ])
            ->all();

        $byStatusQuery = HseIncident::query()->where('site_id', $siteId);
        IotTimeRange::applySince($byStatusQuery, 'occurred_at', $selectedDays);

        $byStatus = $byStatusQuery
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->status,
                'count' => (int) $row->total,
            ])
            ->all();

        return [
            'byType' => $byType,
            'byStatus' => $byStatus,
            'timeline' => $this->eventTimeline(
                HseIncident::query()->where('site_id', $siteId),
                'occurred_at',
                $chartDays,
            ),
            'chartDays' => $chartDays,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function udpmPageAnalytics(int $siteId, int $selectedDays = 90): array
    {
        $reports = UdpmWeeklyReport::query()->where('site_id', $siteId);
        IotTimeRange::applySince($reports, 'week_start', $selectedDays);

        $byStatus = (clone $reports)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn ($row): array => [
                'label' => (string) $row->status,
                'count' => (int) $row->total,
            ])
            ->all();

        $compliance = config('siteguard.udpm_compliance_matrix', [
            'automated' => 6,
            'manual' => 2,
            'partial' => 2,
            'sections' => 10,
        ]);

        return [
            'byStatus' => $byStatus,
            'compliance' => $compliance,
            'reportCount' => (clone $reports)->count(),
        ];
    }

    /**
     * @return array{edge: int, rfid: int, gas: int, sensors: int, expected_edge: int|null, expected_rfid: int|null, expected_gas: int|null, expected_sensors: int|null}
     */
    public function fieldDevicesInventorySummary(int $siteId): array
    {
        $expected = $this->expectedDeviceCounts($siteId);

        return [
            'edge' => EdgeDevice::query()->where('site_id', $siteId)->count(),
            'rfid' => RfidReader::query()->where('site_id', $siteId)->count(),
            'gas' => GasGateway::query()->where('site_id', $siteId)->count(),
            'sensors' => SensorDevice::query()->where('site_id', $siteId)->count(),
            'expected_edge' => $expected['edge_devices'] ?? null,
            'expected_rfid' => $expected['rfid_readers'] ?? null,
            'expected_gas' => $expected['gas_gateways'] ?? null,
            'expected_sensors' => $expected['sensor_devices'] ?? null,
        ];
    }

    /**
     * @return array{labels: list<string>, values: list<int>}
     */
    private function eventTimeline(Builder $query, string $column, int $days): array
    {
        $since = now()->subDays(max($days - 1, 0))->startOfDay();
        $dateExpr = IotTimeRange::dateBucketExpression($column);

        $countsByDay = (clone $query)
            ->where($column, '>=', $since)
            ->selectRaw("{$dateExpr} as bucket, COUNT(*) as total")
            ->groupBy('bucket')
            ->pluck('total', 'bucket');

        return $this->rollupCountSeries($since, now()->endOfDay(), $days, $countsByDay);
    }

    /**
     * @return array{labels: list<string>, counts: list<int>}
     */
    private function rollupCountSeries(
        CarbonInterface $since,
        CarbonInterface $until,
        int $days,
        Collection $countsByDay,
    ): array {
        $rolled = $this->rollupDualCountSeries($since, $until, $days, $countsByDay, collect());

        return [
            'labels' => $rolled['labels'],
            'counts' => $rolled['entries'],
            'values' => $rolled['entries'],
        ];
    }

    /**
     * @return array{labels: list<string>, entries: list<int>, exits: list<int>}
     */
    private function rollupDualCountSeries(
        CarbonInterface $since,
        CarbonInterface $until,
        int $days,
        Collection $primaryByDay,
        Collection $secondaryByDay,
    ): array {
        $labels = [];
        $primary = [];
        $secondary = [];

        if ($days > 180) {
            $cursor = $since->copy()->startOfMonth();
            while ($cursor <= $until) {
                $labels[] = $cursor->format('M Y');
                $primary[] = $this->sumDailyBucketsInMonth($primaryByDay, $cursor);
                $secondary[] = $secondaryByDay->isNotEmpty()
                    ? $this->sumDailyBucketsInMonth($secondaryByDay, $cursor)
                    : 0;
                $cursor = $cursor->copy()->addMonth();
            }
        } elseif ($days > 60) {
            $cursor = $since->copy()->startOfWeek();
            while ($cursor <= $until) {
                $labels[] = $cursor->format('M j');
                $primary[] = $this->sumDailyBucketsInWeek($primaryByDay, $cursor);
                $secondary[] = $secondaryByDay->isNotEmpty()
                    ? $this->sumDailyBucketsInWeek($secondaryByDay, $cursor)
                    : 0;
                $cursor = $cursor->copy()->addWeek();
            }
        } else {
            $cursor = $since->copy()->startOfDay();
            while ($cursor <= $until) {
                $key = $cursor->format('Y-m-d');
                $labels[] = $cursor->format('M j');
                $primary[] = (int) ($primaryByDay[$key] ?? 0);
                $secondary[] = (int) ($secondaryByDay[$key] ?? 0);
                $cursor = $cursor->copy()->addDay();
            }
        }

        return [
            'labels' => $labels,
            'entries' => $primary,
            'exits' => $secondary,
        ];
    }

    /**
     * @return array{labels: list<string>, lel: list<float|null>, o2: list<float|null>, h2s: list<float|null>, co: list<float|null>}
     */
    private function rollupGasDailySeries(
        CarbonInterface $since,
        CarbonInterface $until,
        int $days,
        Collection $rowsByDay,
    ): array {
        $labels = [];
        $lel = [];
        $o2 = [];
        $h2s = [];
        $co = [];

        if ($days > 180) {
            $cursor = $since->copy()->startOfMonth();
            while ($cursor <= $until) {
                $labels[] = $cursor->format('M Y');
                [$l, $o, $h, $c] = $this->avgGasBucketsInMonth($rowsByDay, $cursor);
                $lel[] = $l;
                $o2[] = $o;
                $h2s[] = $h;
                $co[] = $c;
                $cursor = $cursor->copy()->addMonth();
            }
        } elseif ($days > 60) {
            $cursor = $since->copy()->startOfWeek();
            while ($cursor <= $until) {
                $labels[] = $cursor->format('M j');
                [$l, $o, $h, $c] = $this->avgGasBucketsInWeek($rowsByDay, $cursor);
                $lel[] = $l;
                $o2[] = $o;
                $h2s[] = $h;
                $co[] = $c;
                $cursor = $cursor->copy()->addWeek();
            }
        } else {
            $cursor = $since->copy()->startOfDay();
            while ($cursor <= $until) {
                $key = $cursor->format('Y-m-d');
                $labels[] = $cursor->format('M j');
                $row = $rowsByDay->get($key);
                $lel[] = $row?->lel_avg !== null ? round((float) $row->lel_avg, 2) : null;
                $o2[] = $row?->o2_avg !== null ? round((float) $row->o2_avg, 2) : null;
                $h2s[] = $row?->h2s_avg !== null ? round((float) $row->h2s_avg, 2) : null;
                $co[] = $row?->co_avg !== null ? round((float) $row->co_avg, 2) : null;
                $cursor = $cursor->copy()->addDay();
            }
        }

        return compact('labels', 'lel', 'o2', 'h2s', 'co');
    }

    private function sumDailyBucketsInWeek(Collection $countsByDay, CarbonInterface $weekStart): int
    {
        $total = 0;
        $cursor = $weekStart->copy()->startOfDay();

        for ($i = 0; $i < 7; $i++) {
            $total += (int) ($countsByDay[$cursor->format('Y-m-d')] ?? 0);
            $cursor = $cursor->copy()->addDay();
        }

        return $total;
    }

    private function sumDailyBucketsInMonth(Collection $countsByDay, CarbonInterface $monthStart): int
    {
        $total = 0;
        $cursor = $monthStart->copy()->startOfMonth();
        $end = $cursor->copy()->endOfMonth();

        while ($cursor <= $end) {
            $total += (int) ($countsByDay[$cursor->format('Y-m-d')] ?? 0);
            $cursor = $cursor->copy()->addDay();
        }

        return $total;
    }

    /**
     * @return array{0: float|null, 1: float|null, 2: float|null, 3: float|null}
     */
    private function avgGasBucketsInWeek(Collection $rowsByDay, CarbonInterface $weekStart): array
    {
        $lel = [];
        $o2 = [];
        $h2s = [];
        $co = [];
        $cursor = $weekStart->copy()->startOfDay();

        for ($i = 0; $i < 7; $i++) {
            $row = $rowsByDay->get($cursor->format('Y-m-d'));
            if ($row?->lel_avg !== null) {
                $lel[] = (float) $row->lel_avg;
            }
            if ($row?->o2_avg !== null) {
                $o2[] = (float) $row->o2_avg;
            }
            if ($row?->h2s_avg !== null) {
                $h2s[] = (float) $row->h2s_avg;
            }
            if ($row?->co_avg !== null) {
                $co[] = (float) $row->co_avg;
            }
            $cursor = $cursor->copy()->addDay();
        }

        return [
            $lel !== [] ? round(array_sum($lel) / count($lel), 2) : null,
            $o2 !== [] ? round(array_sum($o2) / count($o2), 2) : null,
            $h2s !== [] ? round(array_sum($h2s) / count($h2s), 2) : null,
            $co !== [] ? round(array_sum($co) / count($co), 2) : null,
        ];
    }

    /**
     * @return array{0: float|null, 1: float|null, 2: float|null, 3: float|null}
     */
    private function avgGasBucketsInMonth(Collection $rowsByDay, CarbonInterface $monthStart): array
    {
        $lel = [];
        $o2 = [];
        $h2s = [];
        $co = [];
        $cursor = $monthStart->copy()->startOfMonth();
        $end = $cursor->copy()->endOfMonth();

        while ($cursor <= $end) {
            $row = $rowsByDay->get($cursor->format('Y-m-d'));
            if ($row?->lel_avg !== null) {
                $lel[] = (float) $row->lel_avg;
            }
            if ($row?->o2_avg !== null) {
                $o2[] = (float) $row->o2_avg;
            }
            if ($row?->h2s_avg !== null) {
                $h2s[] = (float) $row->h2s_avg;
            }
            if ($row?->co_avg !== null) {
                $co[] = (float) $row->co_avg;
            }
            $cursor = $cursor->copy()->addDay();
        }

        return [
            $lel !== [] ? round(array_sum($lel) / count($lel), 2) : null,
            $o2 !== [] ? round(array_sum($o2) / count($o2), 2) : null,
            $h2s !== [] ? round(array_sum($h2s) / count($h2s), 2) : null,
            $co !== [] ? round(array_sum($co) / count($co), 2) : null,
        ];
    }

    /**
     * @return array<string, int|null>
     */
    private function expectedDeviceCounts(int $siteId): array
    {
        $site = Site::query()->find($siteId);
        $fromSite = $site?->settings['iot_expected_devices'] ?? [];
        $defaults = config('siteguard.iot_topology_defaults')
            ?? config('siteguard.site_defaults.iot_expected_devices', []);

        return array_merge(is_array($defaults) ? $defaults : [], is_array($fromSite) ? $fromSite : []);
    }

    /**
     * @return array{issued: int, revoked: int, never_used: int, total_devices: int}
     */
    public function ingestTokenSummary(int $siteId): array
    {
        $devices = collect([
            ...EdgeDevice::query()->where('site_id', $siteId)->with('ingestToken')->get(),
            ...RfidReader::query()->where('site_id', $siteId)->with('ingestToken')->get(),
            ...GasGateway::query()->where('site_id', $siteId)->with('ingestToken')->get(),
            ...SensorDevice::query()->where('site_id', $siteId)->with('ingestToken')->get(),
        ]);

        $issued = $devices->filter(fn ($d) => $d->ingestToken !== null)->count();
        $revoked = $devices->filter(fn ($d) => $d->ingestToken?->revoked_at !== null)->count();
        $neverUsed = $devices->filter(fn ($d) => $d->ingestToken !== null && $d->ingestToken->last_used_at === null)->count();

        return [
            'issued' => $issued,
            'revoked' => $revoked,
            'never_used' => $neverUsed,
            'total_devices' => $devices->count(),
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function hourlyAvg(Collection $siteIds, string $parameter, $start, $end): ?float
    {
        $avg = SensorReading::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('parameter', $parameter)
            ->whereBetween('read_at', [$start, $end])
            ->avg('value');

        return $avg !== null ? round((float) $avg, 1) : null;
    }

    /**
     * @return array<int, array{gateway: string, lel_pct: float|string|null}>
     */
    public function latestLelByGateway(int $siteId): array
    {
        return GasGateway::query()
            ->where('site_id', $siteId)
            ->orderBy('code')
            ->get()
            ->map(function (GasGateway $gateway) use ($siteId): array {
                $latest = GasReading::query()
                    ->where('site_id', $siteId)
                    ->where('gas_gateway_id', $gateway->id)
                    ->orderByDesc('read_at')
                    ->first();

                return [
                    'gateway' => $gateway->name,
                    'lel_pct' => $latest?->lel_pct,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array{contractor: string, count: int}>
     */
    public function contractorBreakdown(int $siteId, int $selectedDays = 90): array
    {
        $query = GateEntryExitLog::query()
            ->where('gate_entry_exit_log.site_id', $siteId)
            ->where('direction', 'entry')
            ->leftJoin('worker_records', 'worker_records.id', '=', 'gate_entry_exit_log.worker_record_id');

        IotTimeRange::applySince($query, 'gate_entry_exit_log.occurred_at', $selectedDays);

        return $query
            ->selectRaw("COALESCE(worker_records.contractor, 'Unknown') as contractor, count(*) as total")
            ->groupBy('worker_records.contractor')
            ->orderByDesc('total')
            ->limit(8)
            ->get()
            ->map(fn ($row): array => [
                'contractor' => (string) $row->contractor,
                'count' => (int) $row->total,
            ])
            ->all();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     * @return array{max_lel: float|null, avg_co2: float|null, gateways_online: int, gateways_total: int}
     */
    public function gasSummary(Collection $siteIds, int $selectedDays = 90): array
    {
        $maxLelQuery = GasReading::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds));

        IotTimeRange::applySince($maxLelQuery, 'read_at', $selectedDays);

        $maxLel = $maxLelQuery->max('lel_pct');

        $avgCo2Query = SensorReading::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))
            ->where('parameter', 'co2_ppm');

        IotTimeRange::applySince($avgCo2Query, 'read_at', $selectedDays);

        $avgCo2 = $avgCo2Query->avg('value');

        $gatewaysQuery = GasGateway::query()
            ->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds));

        return [
            'max_lel' => $maxLel !== null ? round((float) $maxLel, 2) : null,
            'avg_co2' => $avgCo2 !== null ? round((float) $avgCo2, 1) : null,
            'gateways_online' => (clone $gatewaysQuery)->where('health_status', 'online')->count(),
            'gateways_total' => (clone $gatewaysQuery)->count(),
        ];
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function devicesOnlineCount(Collection $siteIds): int
    {
        return EdgeDevice::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->where('health_status', 'online')->count()
            + RfidReader::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->where('health_status', 'online')->count()
            + GasGateway::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->where('health_status', 'online')->count()
            + SensorDevice::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->where('health_status', 'online')->count();
    }

    /**
     * @param  Collection<int, int>  $siteIds
     */
    private function devicesTotalCount(Collection $siteIds): int
    {
        return EdgeDevice::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->count()
            + RfidReader::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->count()
            + GasGateway::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->count()
            + SensorDevice::query()->when($siteIds->isNotEmpty(), fn (Builder $q) => $q->whereIn('site_id', $siteIds))->count();
    }
}
