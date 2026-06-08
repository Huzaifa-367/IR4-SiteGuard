<?php

namespace App\Support;

use App\Models\DeploymentApproval;
use App\Models\EdgeDevice;
use App\Models\EquipmentAsset;
use App\Models\EvacuationReport;
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
use App\Models\VehicleViolationLog;
use App\Models\WorkerRecord;
use App\Support\Iot\RfidSiteData;
use Illuminate\Database\Eloquent\Builder;

class SiteGuardAiIotDataService
{
    public function __construct(private Site $site) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(): array
    {
        $siteId = $this->site->id;
        $siteIds = collect([$siteId]);
        $analytics = new IotAnalytics;

        $onSite = RfidTagLastSeen::query()
            ->where('site_id', $siteId)
            ->where('is_on_site', true)
            ->count();

        $openGasAlarms = SensorAlarm::query()
            ->where('site_id', $siteId)
            ->whereNull('cleared_at')
            ->count();

        $hsePending = HseIncident::query()
            ->where('site_id', $siteId)
            ->where('status', 'pending_classification')
            ->count();

        $lsrMissingActions = LsrViolationLog::query()
            ->where('site_id', $siteId)
            ->whereNull('actions_taken')
            ->count();

        return [
            'rfid_ssms' => array_merge($analytics->rfidSummary($siteIds), [
                'zones_total' => RfidZone::query()->where('site_id', $siteId)->where('is_active', true)->count(),
                'workers_registered' => WorkerRecord::query()->where('site_id', $siteId)->where('is_active', true)->count(),
                'gate_events_7d' => GateEntryExitLog::query()
                    ->where('site_id', $siteId)
                    ->where('occurred_at', '>=', now()->subDays(7))
                    ->count(),
                'evacuation_reports' => EvacuationReport::query()->where('site_id', $siteId)->count(),
            ]),
            'gas_environmental' => array_merge($analytics->gasSummary($siteIds), [
                'open_alarms' => $openGasAlarms,
                'gas_gateways' => GasGateway::query()->where('site_id', $siteId)->count(),
                'sensor_devices' => SensorDevice::query()->where('site_id', $siteId)->count(),
            ]),
            'field_devices' => $analytics->fieldDevicesInventorySummary($siteId),
            'equipment' => [
                'assets_total' => EquipmentAsset::query()->where('site_id', $siteId)->count(),
                'by_status' => EquipmentAsset::query()
                    ->where('site_id', $siteId)
                    ->selectRaw('status, count(*) as total')
                    ->groupBy('status')
                    ->pluck('total', 'status')
                    ->all(),
            ],
            'hse_incidents' => [
                'total' => HseIncident::query()->where('site_id', $siteId)->count(),
                'pending_classification' => $hsePending,
                'classified' => HseIncident::query()->where('site_id', $siteId)->where('status', 'classified')->count(),
            ],
            'lsr' => [
                'violations_total' => LsrViolationLog::query()->where('site_id', $siteId)->count(),
                'missing_actions' => $lsrMissingActions,
                'vehicle_violations' => VehicleViolationLog::query()->where('site_id', $siteId)->count(),
            ],
            'udpm_reports' => [
                'total' => UdpmWeeklyReport::query()->where('site_id', $siteId)->count(),
                'draft' => UdpmWeeklyReport::query()->where('site_id', $siteId)->where('status', 'draft')->count(),
                'approved' => UdpmWeeklyReport::query()->where('site_id', $siteId)->where('status', 'approved')->count(),
            ],
            'deployment_approvals' => [
                'pending' => DeploymentApproval::query()->where('site_id', $siteId)->where('status', 'pending')->count(),
                'approved' => DeploymentApproval::query()->where('site_id', $siteId)->where('status', 'approved')->count(),
            ],
            'on_site_headcount' => $onSite,
            'as_of' => now()->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function rfidSsms(
        string $domain,
        ?string $search = null,
        int $days = 7,
        int $limit = 25,
    ): array {
        $days = max(1, min($days, 90));
        $limit = min(max($limit, 1), 50);

        return match ($domain) {
            'overview' => $this->rfidOverview(),
            'zones' => $this->rfidZones($limit),
            'on_site_personnel' => $this->rfidOnSitePersonnel($limit),
            'workers' => $this->rfidWorkers($search, $limit),
            'gate_log' => $this->rfidGateLog($days, $limit),
            'evacuations' => $this->rfidEvacuations($limit),
            'portable_devices' => $this->rfidPortableDevices($limit),
            default => [
                'error' => 'Unknown domain. Use: overview, zones, on_site_personnel, workers, gate_log, evacuations, portable_devices.',
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function gasEnvironmental(
        string $domain,
        int $days = 7,
        int $limit = 25,
    ): array {
        $days = max(1, min($days, 30));
        $limit = min(max($limit, 1), 50);

        return match ($domain) {
            'summary' => $this->gasSummary(),
            'latest_readings' => $this->gasLatestReadings($limit),
            'active_alarms' => $this->gasActiveAlarms($limit),
            'alarm_history' => $this->gasAlarmHistory($days, $limit),
            'environmental_sensors' => $this->environmentalSensors($limit),
            default => [
                'error' => 'Unknown domain. Use: summary, latest_readings, active_alarms, alarm_history, environmental_sensors.',
            ],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function fieldDevices(?string $deviceType = null, ?string $healthStatus = null, int $limit = 40): array
    {
        $limit = min(max($limit, 1), 60);
        $siteId = $this->site->id;

        $mapDevice = fn (object $device, string $type): array => [
            'id' => $device->id,
            'type' => $type,
            'name' => $device->name,
            'code' => $device->code,
            'health_status' => $device->health_status,
            'last_activity' => ($device->last_ingest_at ?? $device->last_heartbeat_at)?->toIso8601String(),
        ];

        $devices = collect();

        if ($deviceType === null || $deviceType === 'edge') {
            $devices = $devices->merge(
                EdgeDevice::query()
                    ->where('site_id', $siteId)
                    ->when($healthStatus, fn (Builder $q) => $q->where('health_status', $healthStatus))
                    ->orderBy('code')
                    ->limit($limit)
                    ->get()
                    ->map(fn (EdgeDevice $d) => $mapDevice($d, 'edge')),
            );
        }

        if ($deviceType === null || $deviceType === 'rfid') {
            $devices = $devices->merge(
                RfidReader::query()
                    ->where('site_id', $siteId)
                    ->with('rfidZone:id,name,code')
                    ->when($healthStatus, fn (Builder $q) => $q->where('health_status', $healthStatus))
                    ->orderBy('code')
                    ->limit($limit)
                    ->get()
                    ->map(fn (RfidReader $d): array => [
                        ...$mapDevice($d, 'rfid'),
                        'zone' => $d->rfidZone?->name,
                        'mount_type' => $d->mount_type,
                    ]),
            );
        }

        if ($deviceType === null || $deviceType === 'gas') {
            $devices = $devices->merge(
                GasGateway::query()
                    ->where('site_id', $siteId)
                    ->when($healthStatus, fn (Builder $q) => $q->where('health_status', $healthStatus))
                    ->orderBy('code')
                    ->limit($limit)
                    ->get()
                    ->map(fn (GasGateway $d): array => [
                        ...$mapDevice($d, 'gas'),
                        'vehicle_label' => $d->vehicle_label,
                    ]),
            );
        }

        if ($deviceType === null || $deviceType === 'sensor') {
            $devices = $devices->merge(
                SensorDevice::query()
                    ->where('site_id', $siteId)
                    ->when($healthStatus, fn (Builder $q) => $q->where('health_status', $healthStatus))
                    ->orderBy('code')
                    ->limit($limit)
                    ->get()
                    ->map(fn (SensorDevice $d): array => [
                        ...$mapDevice($d, 'sensor'),
                        'device_type' => $d->device_type,
                    ]),
            );
        }

        $list = $devices->take($limit)->values();

        return [
            'count' => $list->count(),
            'device_type_filter' => $deviceType,
            'health_status_filter' => $healthStatus,
            'devices' => $list->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function equipmentAssets(
        ?string $search = null,
        ?string $equipmentType = null,
        ?string $status = null,
        int $limit = 25,
    ): array {
        $limit = min(max($limit, 1), 50);

        $assets = EquipmentAsset::query()
            ->where('site_id', $this->site->id)
            ->withCount(['inspections', 'maintenanceRecords', 'documents'])
            ->when($equipmentType, fn (Builder $q) => $q->where('equipment_type', $equipmentType))
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->when($search, function (Builder $q) use ($search): void {
                $term = '%'.addcslashes($search, '%_\\').'%';
                $q->where(function (Builder $inner) use ($term): void {
                    $inner->where('name', 'like', $term)
                        ->orWhere('equipment_id', 'like', $term)
                        ->orWhere('serial_number', 'like', $term);
                });
            })
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(fn (EquipmentAsset $asset): array => [
                'id' => $asset->id,
                'equipment_id' => $asset->equipment_id,
                'name' => $asset->name,
                'equipment_type' => $asset->equipment_type,
                'status' => $asset->status,
                'manufacturer' => $asset->manufacturer,
                'location_note' => $asset->location_note,
                'inspections_count' => $asset->inspections_count,
                'maintenance_records_count' => $asset->maintenance_records_count,
                'documents_count' => $asset->documents_count,
                'registered_at' => $asset->registered_at?->toIso8601String(),
            ]);

        return [
            'count' => $assets->count(),
            'assets' => $assets->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function hseIncidents(
        ?string $status = null,
        ?string $severity = null,
        ?string $incidentType = null,
        int $days = 90,
        int $limit = 25,
    ): array {
        $days = max(1, min($days, 365));
        $limit = min(max($limit, 1), 50);

        $incidents = HseIncident::query()
            ->where('site_id', $this->site->id)
            ->with(['rfidZone:id,name', 'camera:id,name', 'classifiedBy:id,name'])
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->when($severity, fn (Builder $q) => $q->where('severity', $severity))
            ->when($incidentType, fn (Builder $q) => $q->where('incident_type', $incidentType))
            ->where('occurred_at', '>=', now()->subDays($days))
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (HseIncident $incident): array => [
                'id' => $incident->id,
                'incident_number' => $incident->incident_number,
                'status' => $incident->status,
                'severity' => $incident->severity,
                'incident_type' => $incident->incident_type,
                'occurred_at' => $incident->occurred_at->toIso8601String(),
                'rfid_zone' => $incident->rfidZone?->name,
                'camera' => $incident->camera?->name,
                'linked_alert_ids' => $incident->alert_ids ?? [],
                'workers_involved' => $incident->workers_involved ?? [],
                'classified_by' => $incident->classifiedBy?->name,
                'classified_at' => $incident->classified_at?->toIso8601String(),
            ]);

        return [
            'count' => $incidents->count(),
            'incidents' => $incidents->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function lsrViolations(
        ?string $detectionMode = null,
        ?string $category = null,
        bool $missingActionsOnly = false,
        bool $includeVehicleViolations = true,
        int $days = 90,
        int $limit = 25,
    ): array {
        $days = max(1, min($days, 365));
        $limit = min(max($limit, 1), 50);

        $violations = LsrViolationLog::query()
            ->where('site_id', $this->site->id)
            ->with(['alert:id,title,severity', 'rfidZone:id,name', 'loggedBy:id,name'])
            ->when($detectionMode, fn (Builder $q) => $q->where('detection_mode', $detectionMode))
            ->when($category, fn (Builder $q) => $q->where('lsr_category', $category))
            ->when($missingActionsOnly, fn (Builder $q) => $q->whereNull('actions_taken'))
            ->where('occurred_at', '>=', now()->subDays($days))
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (LsrViolationLog $log): array => [
                'id' => $log->id,
                'lsr_category' => $log->lsr_category,
                'detection_mode' => $log->detection_mode,
                'description' => str($log->description)->limit(400)->toString(),
                'actions_taken' => $log->actions_taken,
                'occurred_at' => $log->occurred_at->toIso8601String(),
                'alert_id' => $log->alert_id,
                'alert_title' => $log->alert?->title,
                'rfid_zone' => $log->rfidZone?->name,
                'logged_by' => $log->loggedBy?->name,
                'worker_record_ids' => $log->worker_record_ids ?? [],
            ]);

        $vehicleViolations = collect();

        if ($includeVehicleViolations) {
            $vehicleViolations = VehicleViolationLog::query()
                ->where('site_id', $this->site->id)
                ->with(['equipmentAsset:id,equipment_id,name', 'loggedBy:id,name'])
                ->where('occurred_at', '>=', now()->subDays($days))
                ->orderByDesc('occurred_at')
                ->limit($limit)
                ->get()
                ->map(fn (VehicleViolationLog $log): array => [
                    'id' => $log->id,
                    'vehicle_description' => $log->vehicle_description,
                    'violation_type' => $log->violation_type,
                    'description' => str($log->description)->limit(400)->toString(),
                    'actions_taken' => $log->actions_taken,
                    'occurred_at' => $log->occurred_at->toIso8601String(),
                    'equipment_asset' => $log->equipmentAsset
                        ? "{$log->equipmentAsset->equipment_id} — {$log->equipmentAsset->name}"
                        : null,
                    'logged_by' => $log->loggedBy?->name,
                ]);
        }

        return [
            'lsr_violations_count' => $violations->count(),
            'lsr_violations' => $violations->all(),
            'vehicle_violations_count' => $vehicleViolations->count(),
            'vehicle_violations' => $vehicleViolations->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function udpmReports(?string $status = null, int $limit = 12): array
    {
        $limit = min(max($limit, 1), 24);

        $reports = UdpmWeeklyReport::query()
            ->where('site_id', $this->site->id)
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->orderByDesc('week_start')
            ->limit($limit)
            ->get()
            ->map(fn (UdpmWeeklyReport $report): array => [
                'id' => $report->id,
                'week_start' => $report->week_start->toDateString(),
                'week_end' => $report->week_end->toDateString(),
                'status' => $report->status,
                'generated_at' => $report->generated_at?->toIso8601String(),
                'compliance_summary' => $report->compliance_summary,
                'section_keys' => array_keys($report->payload['sections'] ?? []),
            ]);

        return [
            'count' => $reports->count(),
            'reports' => $reports->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function deploymentApprovals(?string $status = null, int $limit = 20): array
    {
        $limit = min(max($limit, 1), 30);

        $approvals = DeploymentApproval::query()
            ->where('site_id', $this->site->id)
            ->when($status, fn (Builder $q) => $q->where('status', $status))
            ->orderByDesc('submitted_at')
            ->limit($limit)
            ->get()
            ->map(fn (DeploymentApproval $approval): array => [
                'id' => $approval->id,
                'approval_type' => $approval->approval_type,
                'status' => $approval->status,
                'submitted_at' => $approval->submitted_at?->toIso8601String(),
                'approved_at' => $approval->approved_at?->toIso8601String(),
                'notes' => str($approval->notes)->limit(300)->toString(),
            ]);

        return [
            'count' => $approvals->count(),
            'approvals' => $approvals->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidOverview(): array
    {
        $data = new RfidSiteData($this->site);
        $analytics = new IotAnalytics;

        return [
            'on_site_count' => RfidTagLastSeen::query()
                ->where('site_id', $this->site->id)
                ->where('is_on_site', true)
                ->count(),
            'summary' => $analytics->rfidSummary(collect([$this->site->id])),
            'zone_occupancy' => $analytics->zoneOccupancy(collect([$this->site->id])),
            'gate_flow_7d' => $analytics->gateFlow(collect([$this->site->id]), 7),
            'contractor_breakdown' => $analytics->contractorBreakdown($this->site->id),
            'permissions_note' => 'Use domains zones, on_site_personnel, workers, gate_log, evacuations, portable_devices for detail.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidZones(int $limit): array
    {
        $data = new RfidSiteData($this->site);

        return [
            'count' => count($data->zones()),
            'zones' => array_slice($data->zones(), 0, $limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidOnSitePersonnel(int $limit): array
    {
        $data = new RfidSiteData($this->site);
        $personnel = $data->onSitePersonnel();

        return [
            'count' => count($personnel),
            'personnel' => array_slice($personnel, 0, $limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidWorkers(?string $search, int $limit): array
    {
        $workers = WorkerRecord::query()
            ->where('site_id', $this->site->id)
            ->where('is_active', true)
            ->when($search, function (Builder $q) use ($search): void {
                $term = '%'.addcslashes($search, '%_\\').'%';
                $q->where(function (Builder $inner) use ($term): void {
                    $inner->where('full_name', 'like', $term)
                        ->orWhere('contractor', 'like', $term)
                        ->orWhere('tag_epc', 'like', $term)
                        ->orWhere('role', 'like', $term);
                });
            })
            ->orderBy('full_name')
            ->limit($limit)
            ->get(['id', 'full_name', 'contractor', 'role', 'tag_epc', 'portable_device_approved']);

        return [
            'count' => $workers->count(),
            'workers' => $workers->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidGateLog(int $days, int $limit): array
    {
        $logs = GateEntryExitLog::query()
            ->where('site_id', $this->site->id)
            ->with(['worker:id,full_name', 'gateReader:id,name,code'])
            ->where('occurred_at', '>=', now()->subDays($days))
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (GateEntryExitLog $log): array => [
                'id' => $log->id,
                'direction' => $log->direction,
                'tag_epc' => $log->tag_epc,
                'worker' => $log->worker?->full_name,
                'gate_reader' => $log->gateReader?->name,
                'occurred_at' => $log->occurred_at->toIso8601String(),
            ]);

        return [
            'days' => $days,
            'count' => $logs->count(),
            'events' => $logs->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidEvacuations(int $limit): array
    {
        $data = new RfidSiteData($this->site);

        return [
            'count' => count($data->evacuationReports($limit)),
            'reports' => $data->evacuationReports($limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rfidPortableDevices(int $limit): array
    {
        $data = new RfidSiteData($this->site);
        $register = $data->portableRegister();

        return [
            'count' => count($register),
            'register' => array_slice($register, 0, $limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function gasSummary(): array
    {
        $analytics = new IotAnalytics;

        return $analytics->gasSummary(collect([$this->site->id]));
    }

    /**
     * @return array<string, mixed>
     */
    private function gasLatestReadings(int $limit): array
    {
        $siteId = $this->site->id;

        $gateways = GasGateway::query()
            ->where('site_id', $siteId)
            ->orderBy('code')
            ->limit($limit)
            ->get()
            ->map(function (GasGateway $gateway) use ($siteId): array {
                $latest = GasReading::query()
                    ->where('site_id', $siteId)
                    ->where('gas_gateway_id', $gateway->id)
                    ->orderByDesc('read_at')
                    ->first();

                return [
                    'gateway' => $gateway->name,
                    'code' => $gateway->code,
                    'vehicle' => $gateway->vehicle_label,
                    'health_status' => $gateway->health_status,
                    'latest' => $latest ? [
                        'lel_pct' => $latest->lel_pct,
                        'o2_pct' => $latest->o2_pct,
                        'h2s_ppm' => $latest->h2s_ppm,
                        'co_ppm' => $latest->co_ppm,
                        'alarm_state' => $latest->alarm_state,
                        'read_at' => $latest->read_at->toIso8601String(),
                    ] : null,
                ];
            });

        return [
            'count' => $gateways->count(),
            'gas_gateways' => $gateways->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function gasActiveAlarms(int $limit): array
    {
        $alarms = SensorAlarm::query()
            ->where('site_id', $this->site->id)
            ->whereNull('cleared_at')
            ->orderByDesc('alarm_at')
            ->limit($limit)
            ->get()
            ->map(fn (SensorAlarm $alarm): array => [
                'id' => $alarm->id,
                'parameter' => $alarm->parameter,
                'value' => $alarm->value,
                'threshold' => $alarm->threshold,
                'severity' => $alarm->severity,
                'source_type' => $alarm->source_type,
                'alert_id' => $alarm->alert_id,
                'alarm_at' => $alarm->alarm_at->toIso8601String(),
            ]);

        return [
            'count' => $alarms->count(),
            'alarms' => $alarms->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function gasAlarmHistory(int $days, int $limit): array
    {
        $analytics = new IotAnalytics;

        return [
            'days' => $days,
            'history' => array_slice($analytics->alarmHistory(collect([$this->site->id]), $days), 0, $limit),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function environmentalSensors(int $limit): array
    {
        $siteId = $this->site->id;

        $sensors = SensorDevice::query()
            ->where('site_id', $siteId)
            ->orderBy('code')
            ->limit($limit)
            ->get()
            ->map(function (SensorDevice $device) use ($siteId): array {
                $latestReadings = SensorReading::query()
                    ->where('site_id', $siteId)
                    ->where('sensor_device_id', $device->id)
                    ->orderByDesc('read_at')
                    ->limit(8)
                    ->get()
                    ->map(fn (SensorReading $reading): array => [
                        'parameter' => $reading->parameter,
                        'value' => $reading->value,
                        'unit' => $reading->unit,
                        'read_at' => $reading->read_at->toIso8601String(),
                    ]);

                return [
                    'name' => $device->name,
                    'code' => $device->code,
                    'device_type' => $device->device_type,
                    'health_status' => $device->health_status,
                    'recent_readings' => $latestReadings->all(),
                ];
            });

        return [
            'count' => $sensors->count(),
            'sensors' => $sensors->all(),
        ];
    }
}
