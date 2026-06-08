<?php

namespace App\Services\Reports;

use App\Models\Alert;
use App\Models\Camera;
use App\Models\DetectionModule;
use App\Models\EquipmentAsset;
use App\Models\GasGateway;
use App\Models\GasReading;
use App\Models\GateEntryExitLog;
use App\Models\HseIncident;
use App\Models\LsrViolationLog;
use App\Models\SensorAlarm;
use App\Models\SensorReading;
use App\Models\Site;
use App\Models\SiteHeadcountSnapshot;
use App\Models\UdpmWeeklyReport;
use App\Models\VehicleViolationLog;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class UdpmWeeklyReportService
{
    /**
     * @return array{report: UdpmWeeklyReport, payload: array<string, mixed>}
     */
    public function generate(Site $site, ?CarbonInterface $weekStart = null, ?int $userId = null): array
    {
        $start = Carbon::parse($weekStart ?? now()->startOfWeek())->startOfDay();
        $end = $start->copy()->endOfWeek()->endOfDay();

        $ppeModule = DetectionModule::query()->where('key', 'ppe')->first();

        $ppeAlertsQuery = $ppeModule
            ? Alert::query()
                ->where('site_id', $site->id)
                ->where('detection_module_id', $ppeModule->id)
                ->whereBetween('opened_at', [$start, $end])
            : null;

        $ppeAlerts = $ppeAlertsQuery?->count() ?? 0;

        $ppeDaily = $ppeAlertsQuery
            ? (clone $ppeAlertsQuery)
                ->selectRaw('DATE(opened_at) as day, count(*) as total')
                ->groupBy('day')
                ->orderBy('day')
                ->get()
                ->map(fn ($row): array => [
                    'date' => $row->day,
                    'count' => (int) $row->total,
                ])
                ->all()
            : [];

        $ppeByViolationType = $ppeAlertsQuery
            ? (clone $ppeAlertsQuery)
                ->with('rule:id,code,name')
                ->get()
                ->groupBy(fn (Alert $alert): string => $alert->rule?->code ?? 'unknown')
                ->map(fn ($group, string $code): array => [
                    'rule_code' => $code,
                    'rule_name' => $group->first()?->rule?->name ?? $code,
                    'count' => $group->count(),
                ])
                ->values()
                ->all()
            : [];

        $ppeByCamera = $ppeAlertsQuery
            ? (clone $ppeAlertsQuery)
                ->whereNotNull('camera_id')
                ->selectRaw('camera_id, count(*) as total')
                ->groupBy('camera_id')
                ->get()
                ->map(function ($row) use ($site): array {
                    $camera = Camera::query()->where('site_id', $site->id)->find($row->camera_id);

                    return [
                        'camera_id' => $row->camera_id,
                        'camera_name' => $camera?->name ?? 'Camera '.$row->camera_id,
                        'count' => (int) $row->total,
                    ];
                })
                ->all()
            : [];

        $lsrLogs = LsrViolationLog::query()
            ->where('site_id', $site->id)
            ->whereBetween('occurred_at', [$start, $end])
            ->get();

        $classifiedIncidents = HseIncident::query()
            ->where('site_id', $site->id)
            ->where('status', 'classified')
            ->whereBetween('occurred_at', [$start, $end])
            ->get(['id', 'incident_number', 'severity', 'incident_type', 'occurred_at']);

        $pendingIncidents = HseIncident::query()
            ->where('site_id', $site->id)
            ->whereIn('status', ['draft', 'pending_classification'])
            ->whereBetween('occurred_at', [$start, $end])
            ->get(['id', 'incident_number', 'status', 'incident_type', 'occurred_at']);

        $weatherReadings = SensorReading::query()
            ->where('site_id', $site->id)
            ->whereIn('parameter', ['temp_c', 'humidity_pct', 'wind_speed_mps'])
            ->whereBetween('read_at', [$start, $end])
            ->selectRaw('parameter, MIN(value) as min_val, MAX(value) as max_val, AVG(value) as avg_val')
            ->groupBy('parameter')
            ->get();

        $envReadings = SensorReading::query()
            ->where('site_id', $site->id)
            ->whereNotIn('parameter', ['temp_c', 'humidity_pct', 'wind_speed_mps', 'co2_ppm'])
            ->whereBetween('read_at', [$start, $end])
            ->selectRaw('parameter, MIN(value) as min_val, MAX(value) as max_val, AVG(value) as avg_val')
            ->groupBy('parameter')
            ->get();

        $headcountSnapshots = SiteHeadcountSnapshot::query()
            ->where('site_id', $site->id)
            ->whereBetween('recorded_at', [$start, $end])
            ->get(['recorded_at', 'on_site_count']);

        $onSitePeak = $headcountSnapshots->max('on_site_count')
            ?? 0;

        $weeklyAvg = $headcountSnapshots->isNotEmpty()
            ? (int) round($headcountSnapshots->avg('on_site_count'))
            : 0;

        $gasSummary = GasReading::query()
            ->where('site_id', $site->id)
            ->whereBetween('read_at', [$start, $end])
            ->selectRaw('gas_gateway_id, MIN(lel_pct) as lel_min, MAX(lel_pct) as lel_max, AVG(lel_pct) as lel_avg')
            ->groupBy('gas_gateway_id')
            ->get();

        $co2Summary = SensorReading::query()
            ->where('site_id', $site->id)
            ->where('parameter', 'co2_ppm')
            ->whereBetween('read_at', [$start, $end])
            ->selectRaw('sensor_device_id, MIN(value) as min_val, MAX(value) as max_val, AVG(value) as avg_val')
            ->groupBy('sensor_device_id')
            ->get();

        $vehicleCount = EquipmentAsset::query()
            ->where('site_id', $site->id)
            ->where('equipment_type', 'vehicle')
            ->where('status', 'active')
            ->count();

        $vehicleViolations = VehicleViolationLog::query()
            ->where('site_id', $site->id)
            ->whereBetween('occurred_at', [$start, $end])
            ->get(['id', 'vehicle_description', 'violation_type', 'description', 'actions_taken', 'occurred_at']);

        $gasAlarms = SensorAlarm::query()
            ->where('site_id', $site->id)
            ->where('source_type', GasGateway::class)
            ->whereBetween('alarm_at', [$start, $end])
            ->get(['parameter', 'value', 'threshold', 'severity', 'alarm_at']);

        $payload = [
            'site' => [
                'name' => $site->name,
                'code' => $site->code,
                'week_label' => $start->format('o-\WW'),
            ],
            'sections' => [
                'i_daily_safety_observations' => [
                    'ppe_alert_count' => $ppeAlerts,
                    'days' => $ppeDaily,
                    'by_violation_type' => $ppeByViolationType,
                    'by_camera' => $ppeByCamera,
                ],
                'ii_hse_incidents' => [
                    'classified' => $classifiedIncidents->toArray(),
                    'pending_classification' => $pendingIncidents->toArray(),
                ],
                'iii_lsr_violations' => [
                    'automated' => $lsrLogs->where('detection_mode', 'automated')->values()->toArray(),
                    'manual' => $lsrLogs->where('detection_mode', 'manual')->values()->toArray(),
                    'missing_actions_count' => $lsrLogs->whereNull('actions_taken')->count(),
                ],
                'iv_weather' => ['daily' => $weatherReadings->toArray()],
                'v_manpower' => [
                    'peak_on_site' => (int) $onSitePeak,
                    'weekly_avg_on_site' => $weeklyAvg,
                    'snapshot_days' => $headcountSnapshots->count(),
                    'gate_events' => GateEntryExitLog::query()
                        ->where('site_id', $site->id)
                        ->whereBetween('occurred_at', [$start, $end])
                        ->count(),
                ],
                'vi_vehicles_monitored' => [
                    'count' => $vehicleCount,
                    'source' => 'equipment_assets',
                ],
                'vii_vehicle_violations' => ['entries' => $vehicleViolations->toArray()],
                'viii_environmental' => ['parameters' => $envReadings->toArray()],
                'ix_gas' => [
                    'by_gateway' => $gasSummary->toArray(),
                    'alarms' => $gasAlarms->toArray(),
                ],
                'x_co2' => ['by_device' => $co2Summary->toArray()],
            ],
            'compliance_matrix' => [
                'i' => 'automated',
                'ii' => 'auto_plus_manual',
                'iii' => 'auto_plus_manual',
                'iv' => 'automated',
                'v' => 'automated',
                'vi' => 'automated',
                'vii' => 'manual',
                'viii' => 'automated',
                'ix' => 'automated',
                'x' => 'automated',
            ],
        ];

        $report = UdpmWeeklyReport::query()->create([
            'site_id' => $site->id,
            'week_start' => $start->toDateString(),
            'week_end' => $end->toDateString(),
            'status' => 'generated',
            'generated_at' => now(),
            'generated_by_user_id' => $userId,
            'payload' => $payload,
            'compliance_summary' => $payload['compliance_matrix'],
        ]);

        return ['report' => $report, 'payload' => $payload];
    }

    public function nextIncidentNumber(Site $site): string
    {
        $count = HseIncident::query()->where('site_id', $site->id)->count();

        return 'INC-'.now()->format('Y').'-'.str_pad((string) ($count + 1), 5, '0', STR_PAD_LEFT);
    }

    public function generateQrSlug(): string
    {
        return Str::lower(Str::random(12));
    }
}
