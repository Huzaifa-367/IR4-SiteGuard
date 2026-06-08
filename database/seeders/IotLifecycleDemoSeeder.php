<?php

namespace Database\Seeders;

use App\Models\Alert;
use App\Models\DeploymentApproval;
use App\Models\DetectionModule;
use App\Models\EdgeDevice;
use App\Models\EquipmentAsset;
use App\Models\EquipmentDocument;
use App\Models\EquipmentInspection;
use App\Models\EquipmentMaintenanceRecord;
use App\Models\EquipmentQrScan;
use App\Models\EvacuationReport;
use App\Models\GasGateway;
use App\Models\GateEntryExitLog;
use App\Models\Investigation;
use App\Models\RfidReader;
use App\Models\RfidReadEvent;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\Rule;
use App\Models\SensorDevice;
use App\Models\Site;
use App\Models\User;
use App\Models\WorkerRecord;
use App\Services\Ingest\IngestTokenService;
use App\Services\Reports\UdpmWeeklyReportService;
use App\Support\DefaultSiteRules;
use Database\Seeders\Support\IotBulkInserter;
use Database\Seeders\Support\IotHistoricalDataGenerator;
use Database\Seeders\Support\IotScenarioCatalog;
use Database\Seeders\Support\IotSiteDataCleaner;
use Database\Seeders\Support\IotWorkCalendar;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IotLifecycleDemoSeeder extends Seeder
{
    /**
     * @var Collection<string, DetectionModule>
     */
    private Collection $modules;

    public function run(): void
    {
        DB::disableQueryLog();

        if (DetectionModule::query()->count() === 0) {
            $this->command?->warn('  Detection modules missing — run DetectionModuleSeeder first.');
            $this->call(DetectionModuleSeeder::class);
        }

        if (User::query()->count() === 0) {
            $this->command?->warn('  Demo users missing — run DemoUserSeeder first.');
            $this->call(DemoUserSeeder::class);
        }

        $this->modules = DetectionModule::query()->get()->keyBy('key');
        $cleaner = new IotSiteDataCleaner;

        $admin = User::query()->where('email', 'admin@siteguard.test')->first();
        $hse = User::query()->where('email', 'hse@siteguard.test')->first();
        $supervisor = User::query()->where('email', 'supervisor@siteguard.test')->first();
        $operator = User::query()->where('email', 'scc_operator@siteguard.test')->first();
        $viewer = User::query()->where('email', 'viewer@siteguard.test')->first();
        $siteStaff = User::query()->where('email', 'site_staff@siteguard.test')->first();

        foreach (IotScenarioCatalog::sites() as $siteDef) {
            $site = $this->ensureSite($siteDef, $admin, $hse, $supervisor, $operator, $viewer, $siteStaff);
            $this->command?->info("  IoT lifecycle: {$site->code} ({$this->resolveHistoryDays($site, $siteDef['scale'])} days history)");
            $cleaner->clear($site);
            $this->seedSiteLifecycle($site, $siteDef['scale'], $admin, $hse);
            $this->reportSiteCounts($site);
        }
    }

    private function reportSiteCounts(Site $site): void
    {
        $counts = [
            'workers' => WorkerRecord::query()->where('site_id', $site->id)->count(),
            'gate events' => GateEntryExitLog::query()->where('site_id', $site->id)->count(),
            'rfid reads' => RfidReadEvent::query()->where('site_id', $site->id)->count(),
            'gas readings' => DB::table('gas_readings')->where('site_id', $site->id)->count(),
            'lsr logs' => DB::table('lsr_violation_logs')->where('site_id', $site->id)->count(),
            'on site' => RfidTagLastSeen::query()->where('site_id', $site->id)->where('is_on_site', true)->count(),
        ];

        $summary = collect($counts)->map(fn (int $count, string $label): string => "{$label}={$count}")->implode(', ');
        $this->command?->info("    ✓ {$site->code}: {$summary}");
    }

    private function resolveHistoryDays(Site $site, float $scale): int
    {
        if (env('IOT_DEMO_HISTORY_DAYS') !== null) {
            return max(30, (int) env('IOT_DEMO_HISTORY_DAYS'));
        }

        $bySite = config('siteguard.iot_demo_seed.history_days_by_site', []);

        return max(30, (int) ($bySite[$site->code] ?? config('siteguard.iot_demo_seed.history_days', 548)));
    }

    /**
     * @param  array{code: string, name: string, timezone: string, address: string, lat: float, lng: float, scale: float}  $siteDef
     */
    private function ensureSite(
        array $siteDef,
        ?User $admin,
        ?User $hse,
        ?User $supervisor,
        ?User $operator = null,
        ?User $viewer = null,
        ?User $siteStaff = null,
    ): Site {
        $site = Site::query()->updateOrCreate(
            ['code' => $siteDef['code']],
            [
                'name' => $siteDef['name'],
                'timezone' => $siteDef['timezone'],
                'address' => $siteDef['address'],
                'status' => 'active',
                'map_center_lat' => $siteDef['lat'],
                'map_center_lng' => $siteDef['lng'],
                'settings' => config('siteguard.site_defaults'),
            ],
        );

        $moduleSync = [];
        foreach ($this->modules as $module) {
            $moduleSync[$module->id] = [
                'is_enabled' => true,
                'settings' => json_encode([]),
            ];
        }
        $site->detectionModules()->syncWithoutDetaching($moduleSync);

        DefaultSiteRules::seedFor($site);

        $siteUsers = array_filter([$admin, $hse, $supervisor, $operator, $viewer, $siteStaff]);

        if ($siteDef['code'] === 'CTCF' && $siteUsers !== []) {
            DB::table('site_user')
                ->whereIn('user_id', collect($siteUsers)->pluck('id'))
                ->update(['is_primary' => false]);
        }

        foreach ($siteUsers as $user) {
            $site->users()->syncWithoutDetaching([
                $user->id => ['is_primary' => $siteDef['code'] === 'CTCF'],
            ]);
        }

        return $site;
    }

    private function seedSiteLifecycle(Site $site, float $scale, ?User $admin, ?User $hse): void
    {
        $tokenService = app(IngestTokenService::class);
        $siteSeed = crc32($site->code);
        $historyDays = $this->resolveHistoryDays($site, $scale);
        $calendar = new IotWorkCalendar($historyDays, $siteSeed, $scale);
        $bulk = new IotBulkInserter;
        $history = new IotHistoricalDataGenerator($site, $scale, $siteSeed, $calendar, $bulk);

        $edges = $this->seedEdgeDevices($site, $tokenService, $admin);
        $zones = $this->seedRfidZones($site);
        $readers = $this->seedRfidReaders($site, $zones, $edges, $tokenService, $admin);
        $gateways = $this->seedGasGateways($site, $edges, $tokenService, $admin);
        $sensors = $this->seedSensorDevices($site, $edges, $tokenService, $admin);

        $workers = $this->seedWorkers($site, $zones, $scale);
        $history->seedGateLifecycle($readers['gate-main'], $workers);
        $history->seedZoneReadEvents($readers, $workers, $zones);
        $this->rebuildTagLastSeen($site, $readers, $workers);

        $gasAlarms = $history->seedGasReadings($gateways);
        $history->seedGasSensorAlarms($gasAlarms);
        $history->seedEnvironmentalReadings($sensors);
        $history->seedHeadcountSnapshots();

        $alerts = $this->seedIotAlerts($site, $zones, $workers, $gateways);
        $this->seedLsrViolations($site, $alerts, $hse, $calendar, $scale);
        $this->seedHseIncidents($site, $zones, $alerts, $hse, $calendar, $scale);

        $this->seedEquipmentLifecycle($site, $admin, $hse, $calendar);
        $this->seedVehicleViolations($site, $hse, $calendar, $scale);
        $this->seedEvacuationReports($site, $workers, $admin, $calendar);
        $this->seedUdpmReports($site, $admin, $hse, $calendar);
        $this->seedDeploymentApprovals($site, $admin, $hse, $calendar);
        $this->seedIotInvestigations($site, $alerts, $hse);
    }

    /**
     * @return array<string, EdgeDevice>
     */
    private function seedEdgeDevices(Site $site, IngestTokenService $tokens, ?User $admin): array
    {
        $map = [];

        foreach (IotScenarioCatalog::edgeDevices() as $def) {
            $edge = $site->edgeDevices()->create([
                'name' => $def['name'],
                'code' => $def['code'],
                'mount_type' => $def['mount_type'],
                'health_status' => 'online',
                'last_heartbeat_at' => now()->subMinutes(3),
                'software_version' => '1.4.2-demo',
            ]);
            $tokens->issueFor($edge, $admin, 'Demo edge token');
            $map[$def['code']] = $edge;
        }

        return $map;
    }

    /**
     * @return array<string, RfidZone>
     */
    private function seedRfidZones(Site $site): array
    {
        $map = [];
        $authorizedWorkerIds = [];

        foreach (IotScenarioCatalog::rfidZones() as $def) {
            $zone = $site->rfidZones()->create([
                'name' => $def['name'],
                'code' => $def['code'],
                'zone_type' => $def['zone_type'],
                'max_occupancy' => $def['max_occupancy'],
                'map_pin_lat' => $def['lat'],
                'map_pin_lng' => $def['lng'],
                'is_active' => true,
                'authorized_worker_ids' => $def['authorized'] ? [] : null,
            ]);
            $map[$def['code']] = $zone;
        }

        return $map;
    }

    /**
     * @param  array<string, RfidZone>  $zones
     * @param  array<string, EdgeDevice>  $edges
     * @return array<string, RfidReader>
     */
    private function seedRfidReaders(Site $site, array $zones, array $edges, IngestTokenService $tokens, ?User $admin): array
    {
        $map = [];

        foreach (IotScenarioCatalog::rfidReaders() as $def) {
            $reader = $site->rfidReaders()->create([
                'rfid_zone_id' => $zones[$def['zone_code']]->id,
                'edge_device_id' => $def['edge_code'] !== null ? $edges[$def['edge_code']]->id : null,
                'name' => $def['name'],
                'code' => $def['code'],
                'mount_type' => $def['mount_type'],
                'ip_address' => $def['mount_type'] === 'gate' ? '10.10.1.50' : null,
                'health_status' => 'online',
                'last_ingest_at' => now()->subMinutes(2),
            ]);
            $tokens->issueFor($reader, $admin, 'Demo RFID token');
            $map[$def['code']] = $reader;
        }

        return $map;
    }

    /**
     * @param  array<string, EdgeDevice>  $edges
     * @return array<string, GasGateway>
     */
    private function seedGasGateways(Site $site, array $edges, IngestTokenService $tokens, ?User $admin): array
    {
        $map = [];

        foreach (IotScenarioCatalog::gasGateways() as $def) {
            $gateway = $site->gasGateways()->create([
                'edge_device_id' => $edges[$def['edge_code']]->id,
                'name' => $def['name'],
                'code' => $def['code'],
                'vehicle_label' => $def['vehicle_label'],
                'health_status' => 'online',
                'last_ingest_at' => now()->subMinutes(5),
            ]);
            $tokens->issueFor($gateway, $admin, 'Demo gas token');
            $map[$def['code']] = $gateway;
        }

        return $map;
    }

    /**
     * @param  array<string, EdgeDevice>  $edges
     * @return array<string, SensorDevice>
     */
    private function seedSensorDevices(Site $site, array $edges, IngestTokenService $tokens, ?User $admin): array
    {
        $map = [];

        foreach (IotScenarioCatalog::sensorDevices() as $def) {
            $sensor = $site->sensorDevices()->create([
                'edge_device_id' => $edges[$def['edge_code']]->id,
                'device_type' => $def['device_type'],
                'name' => $def['name'],
                'code' => $def['code'],
                'modbus_config' => [
                    'port' => '/dev/ttyUSB0',
                    'baud' => 9600,
                    'slave_id' => $def['device_type'] === 'co2_ndir' ? 1 : 2,
                ],
                'health_status' => 'online',
                'last_ingest_at' => now()->subMinutes(4),
            ]);
            $tokens->issueFor($sensor, $admin, 'Demo sensor token');
            $map[$def['code']] = $sensor;
        }

        return $map;
    }

    /**
     * @param  array<string, RfidZone>  $zones
     * @return array<string, WorkerRecord>
     */
    private function seedWorkers(Site $site, array $zones, float $scale): array
    {
        $map = [];
        $restrictedZone = $zones['restricted-pipe'] ?? null;
        $authorizedIds = [];

        foreach (IotScenarioCatalog::workers() as $index => $def) {
            if ($index >= (int) round(count(IotScenarioCatalog::workers()) * $scale)) {
                break;
            }

            $worker = $site->workerRecords()->create([
                'tag_epc' => $def['tag_epc'],
                'employee_number' => $def['employee_number'],
                'full_name' => $def['full_name'],
                'contractor' => $def['contractor'],
                'role' => $def['role'],
                'nationality' => $def['nationality'],
                'is_active' => true,
                'portable_device_approved' => $def['portable_approved'],
                'portable_devices' => $def['portable_devices'],
            ]);

            if ($restrictedZone !== null && $def['zone_code'] === 'restricted-pipe') {
                $authorizedIds[] = $worker->id;
            }

            $map[$def['tag_epc']] = $worker;
        }

        if ($restrictedZone !== null && $authorizedIds !== []) {
            $restrictedZone->update(['authorized_worker_ids' => $authorizedIds]);
        }

        return $map;
    }

    /**
     * @param  array<string, RfidReader>  $readers
     * @param  array<string, WorkerRecord>  $workers
     */
    private function rebuildTagLastSeen(Site $site, array $readers, array $workers): void
    {
        $gateReader = $readers['gate-main'];
        $zonesByCode = $site->rfidZones()->pluck('id', 'code');

        foreach ($workers as $epc => $worker) {
            $def = collect(IotScenarioCatalog::workers())->firstWhere('tag_epc', $epc);
            if ($def === null) {
                continue;
            }

            $lastGate = GateEntryExitLog::query()
                ->where('site_id', $site->id)
                ->where('tag_epc', $epc)
                ->orderByDesc('occurred_at')
                ->first();

            $isOnSite = $lastGate?->direction === 'entry';
            $zoneId = $zonesByCode[$def['zone_code']] ?? $gateReader->rfid_zone_id;
            $zoneReader = collect($readers)->first(fn (RfidReader $r) => $r->rfid_zone_id === $zoneId) ?? $gateReader;

            $lastSeen = $lastGate?->occurred_at ?? now()->subMinutes(10);
            $stationarySince = null;
            if ($def['stationary'] && $isOnSite) {
                $stationarySince = now()->subMinutes(25);
                $lastSeen = now()->subMinutes(8);
            }

            RfidTagLastSeen::query()->create([
                'site_id' => $site->id,
                'tag_epc' => $epc,
                'worker_record_id' => $worker->id,
                'rfid_zone_id' => $zoneId,
                'rfid_reader_id' => $zoneReader->id,
                'last_seen_at' => $lastSeen,
                'is_on_site' => $isOnSite,
                'stationary_since' => $stationarySince,
            ]);
        }
    }

    /**
     * @param  array<string, RfidZone>  $zones
     * @param  array<string, WorkerRecord>  $workers
     * @param  array<string, GasGateway>  $gateways
     * @return array<string, Alert>
     */
    private function seedIotAlerts(Site $site, array $zones, array $workers, array $gateways): array
    {
        $alerts = [];
        $rfidModule = $this->modules->get('rfid_ssms');
        $gasModule = $this->modules->get('gas_monitoring');
        $incidentModule = $this->modules->get('incident_vision');

        if ($rfidModule !== null) {
            $rule001 = Rule::query()->where('site_id', $site->id)->where('code', 'RFID-001')->first();
            if ($rule001 !== null) {
                $alerts['rfid-001'] = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => null,
                    'detection_module_id' => $rfidModule->id,
                    'rule_id' => $rule001->id,
                    'severity' => 'critical',
                    'status' => 'open',
                    'title' => 'Unauthorized zone entry — '.$zones['restricted-pipe']->name,
                    'occurrence_count' => 1,
                    'opened_at' => now()->subDays(2)->setTime(10, 15),
                    'metadata' => ['tag_epc' => 'E2801160600002010000A004'],
                ]);
            }

            $rule002 = Rule::query()->where('site_id', $site->id)->where('code', 'RFID-002')->first();
            $zoneA = $zones['work-front-a'] ?? null;
            if ($rule002 !== null && $zoneA !== null) {
                $alerts['rfid-002'] = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => null,
                    'detection_module_id' => $rfidModule->id,
                    'rule_id' => $rule002->id,
                    'severity' => 'high',
                    'status' => 'acknowledged',
                    'title' => sprintf('Zone occupancy exceeded — %s (26/25)', $zoneA->name),
                    'occurrence_count' => 1,
                    'opened_at' => now()->subDays(4)->setTime(9, 30),
                    'metadata' => ['rfid_zone_id' => $zoneA->id, 'count' => 26, 'max' => 25],
                ]);
            }

            $rule004 = Rule::query()->where('site_id', $site->id)->where('code', 'RFID-004')->first();
            if ($rule004 !== null) {
                $alerts['rfid-004'] = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => null,
                    'detection_module_id' => $rfidModule->id,
                    'rule_id' => $rule004->id,
                    'severity' => 'medium',
                    'status' => 'open',
                    'title' => 'Unknown RFID tag detected — '.IotScenarioCatalog::unknownTagEpc(),
                    'occurrence_count' => 1,
                    'opened_at' => now()->subHours(6),
                    'metadata' => ['tag_epc' => IotScenarioCatalog::unknownTagEpc()],
                ]);
            }

            $rule003 = Rule::query()->where('site_id', $site->id)->where('code', 'RFID-003')->first();
            $correlatedAt = now()->subDay()->setTime(11, 4, 12);
            if ($rule003 !== null) {
                $alerts['rfid-003'] = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => null,
                    'detection_module_id' => $rfidModule->id,
                    'rule_id' => $rule003->id,
                    'severity' => 'high',
                    'status' => 'open',
                    'title' => 'Stationary tag alert — Rajesh Kumar in '.$zones['height-scaffold']->name,
                    'occurrence_count' => 1,
                    'opened_at' => $correlatedAt->copy()->addSeconds(8),
                    'metadata' => [
                        'tag_epc' => 'E2801160600002010000A003',
                        'worker_record_id' => $workers['E2801160600002010000A003']->id ?? null,
                        'rfid_zone_id' => $zones['height-scaffold']->id ?? null,
                    ],
                ]);
            }
        }

        if ($gasModule !== null) {
            $ruleGas = Rule::query()->where('site_id', $site->id)->where('code', 'GAS-001')->first();
            $gw = $gateways['gas-gw-vehicle-02'] ?? null;
            if ($ruleGas !== null && $gw !== null) {
                $alerts['gas-001'] = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => null,
                    'detection_module_id' => $gasModule->id,
                    'rule_id' => $ruleGas->id,
                    'severity' => 'critical',
                    'status' => 'acknowledged',
                    'title' => 'LEL threshold exceeded — '.$gw->name,
                    'occurrence_count' => 1,
                    'opened_at' => now()->subDays(3)->setTime(14, 22),
                    'metadata' => ['gas_gateway_id' => $gw->id, 'lel_pct' => 22.4],
                ]);
            }
        }

        if ($incidentModule !== null) {
            $ruleFall = Rule::query()->where('site_id', $site->id)->where('code', 'HSE-V-001')->first();
            if ($ruleFall !== null) {
                $correlatedAt = now()->subDay()->setTime(11, 4, 12);
                $alerts['hse-fall'] = Alert::query()->create([
                    'site_id' => $site->id,
                    'camera_id' => null,
                    'detection_module_id' => $incidentModule->id,
                    'rule_id' => $ruleFall->id,
                    'severity' => 'critical',
                    'status' => 'open',
                    'title' => 'Fall detected in work zone — scaffold bay',
                    'occurrence_count' => 1,
                    'opened_at' => $correlatedAt,
                ]);
            }
        }

        return $alerts;
    }

    /**
     * @param  array<string, Alert>  $alerts
     */
    private function seedLsrViolations(Site $site, array $alerts, ?User $hse, IotWorkCalendar $calendar, float $scale): void
    {
        $alertMap = [
            'LSR-RZ-001' => $alerts['rfid-001'] ?? null,
            'LSR-OC-001' => $alerts['rfid-002'] ?? null,
            'LSR-WD-001' => $alerts['rfid-003'] ?? null,
            'LSR-GAS-001' => $alerts['gas-001'] ?? null,
        ];

        foreach (IotScenarioCatalog::historicalLsrViolations($calendar, $scale) as $def) {
            $alert = $alertMap[$def['lsr_category']] ?? null;
            $occurredAt = Carbon::parse($def['occurred_at']);
            $linkAlert = $alert !== null && $occurredAt->gte(now()->subDays(30)) ? $alert : null;

            $site->lsrViolationLogs()->create([
                'lsr_category' => $def['lsr_category'],
                'detection_mode' => $def['detection_mode'],
                'occurred_at' => $occurredAt,
                'alert_id' => $linkAlert?->id,
                'description' => $def['description'],
                'actions_taken' => $def['actions_taken'],
                'logged_by_user_id' => $def['detection_mode'] === 'manual' ? $hse?->id : null,
            ]);
        }
    }

    /**
     * @param  array<string, RfidZone>  $zones
     * @param  array<string, Alert>  $alerts
     */
    private function seedHseIncidents(Site $site, array $zones, array $alerts, ?User $hse, IotWorkCalendar $calendar, float $scale): void
    {
        $fallAlert = $alerts['hse-fall'] ?? null;
        $stationaryAlert = $alerts['rfid-003'] ?? null;

        foreach (IotScenarioCatalog::historicalHseIncidents($calendar, $scale) as $def) {
            $occurredAt = Carbon::parse($def['occurred_at']);
            $isRecentCorrelated = ($def['correlated'] ?? false) && $occurredAt->gte(now()->subDays(7));

            $alertIds = match (true) {
                $isRecentCorrelated && $fallAlert && $stationaryAlert => [$fallAlert->id, $stationaryAlert->id],
                $def['incident_type'] === 'fall_correlated' && $isRecentCorrelated && $fallAlert => [$fallAlert->id],
                $def['incident_type'] === 'stationary_tag' && $occurredAt->gte(now()->subDays(14)) && $stationaryAlert => [$stationaryAlert->id],
                default => [],
            };

            $site->hseIncidents()->create([
                'incident_number' => $def['incident_number'],
                'status' => $def['status'],
                'severity' => $def['severity'],
                'incident_type' => $def['incident_type'],
                'occurred_at' => $occurredAt,
                'rfid_zone_id' => $zones['height-scaffold']->id ?? null,
                'alert_ids' => $alertIds !== [] ? $alertIds : null,
                'workers_involved' => [
                    ['name' => 'Rajesh Kumar', 'contractor' => 'Tekfen Construction', 'role' => 'Scaffolder'],
                ],
                'classification' => $def['classified'] ? [
                    'nature_of_incident' => 'Worker fatigue — no injury',
                    'immediate_action_taken' => 'First aid assessment on site',
                    'corrective_action' => 'Rest break policy reinforced',
                    'root_cause_category' => 'human_error',
                    'actions_taken' => 'Toolbox talk scheduled',
                ] : [
                    'draft_title' => ($def['correlated'] ?? false)
                        ? 'Correlated fall + stationary tag — pending classification'
                        : 'Pending safety officer classification',
                    'correlated_stationary' => $def['correlated'] ?? false,
                ],
                'classified_by_user_id' => $def['classified'] ? $hse?->id : null,
                'classified_at' => $def['classified'] ? $occurredAt->copy()->addHours(4) : null,
            ]);
        }
    }

    private function seedVehicleViolations(Site $site, ?User $hse, IotWorkCalendar $calendar, float $scale): void
    {
        $loggerId = $hse?->id ?? User::query()->value('id');
        if ($loggerId === null) {
            return;
        }

        $equipment = $site->equipmentAssets()->where('equipment_type', 'vehicle')->first();

        foreach (IotScenarioCatalog::historicalVehicleViolations($calendar, $scale) as $def) {
            $site->vehicleViolationLogs()->create([
                'occurred_at' => Carbon::parse($def['occurred_at']),
                'vehicle_description' => $def['vehicle_description'],
                'equipment_asset_id' => str_contains($def['vehicle_description'], 'FMC125') ? $equipment?->id : null,
                'violation_type' => $def['violation_type'],
                'description' => $def['description'],
                'actions_taken' => $def['actions_taken'],
                'logged_by_user_id' => $loggerId,
            ]);
        }
    }

    /**
     * @return array<string, EquipmentAsset>
     */
    private function seedEquipmentLifecycle(Site $site, ?User $admin, ?User $hse, IotWorkCalendar $calendar): array
    {
        $map = [];
        $reportService = app(UdpmWeeklyReportService::class);
        $assetIndex = 0;

        foreach (IotScenarioCatalog::equipment() as $def) {
            $registeredAt = $calendar->periodStart()->copy()->addDays(7 + ($assetIndex * 18));
            $asset = $site->equipmentAssets()->create([
                'equipment_id' => $def['equipment_id'],
                'name' => $def['name'],
                'equipment_type' => $def['equipment_type'],
                'status' => $def['status'],
                'manufacturer' => $def['manufacturer'],
                'model' => $def['model'],
                'serial_number' => $def['serial_number'],
                'qr_slug' => $reportService->generateQrSlug(),
                'location_note' => $def['location_note'],
                'registered_at' => $registeredAt,
            ]);
            $map[$def['equipment_id']] = $asset;
            $assetIndex++;

            EquipmentDocument::query()->create([
                'equipment_asset_id' => $asset->id,
                'document_type' => 'manual',
                'title' => $def['name'].' — Operator manual',
                'external_url' => 'https://siteguard.local/manuals/'.Str::slug($def['equipment_id']).'.pdf',
                'uploaded_at' => $registeredAt->copy()->addDays(7),
            ]);

            $inspectionCursor = $registeredAt->copy()->addDays(14);
            while ($inspectionCursor->lte(now())) {
                EquipmentInspection::query()->create([
                    'equipment_asset_id' => $asset->id,
                    'inspected_at' => $inspectionCursor->toDateString(),
                    'inspector_name' => 'Khalid Al-Otaibi',
                    'outcome' => $def['status'] === 'out_of_service' && $inspectionCursor->isAfter(now()->subMonths(2))
                        ? 'fail'
                        : 'pass',
                    'notes' => $def['status'] === 'out_of_service'
                        ? 'Hydraulic leak — out of service until repair'
                        : 'Visual and functional check OK',
                    'next_inspection_due' => $inspectionCursor->copy()->addDays(90)->toDateString(),
                    'created_by_user_id' => $hse?->id,
                ]);

                EquipmentQrScan::query()->create([
                    'equipment_asset_id' => $asset->id,
                    'scanned_at' => $inspectionCursor->copy()->setTime(10, 15),
                    'ip_address' => '10.20.1.'.(100 + ($asset->id % 50)),
                    'user_agent' => 'Mozilla/5.0 (iPhone; Mobile) SiteWiFi',
                ]);

                $inspectionCursor = $inspectionCursor->copy()->addDays(90);
            }

            $maintenanceCursor = $registeredAt->copy()->addDays(60);
            while ($maintenanceCursor->lte(now())) {
                EquipmentMaintenanceRecord::query()->create([
                    'equipment_asset_id' => $asset->id,
                    'performed_at' => $maintenanceCursor->toDateString(),
                    'maintenance_type' => $maintenanceCursor->month % 6 === 0 ? 'corrective' : 'preventive',
                    'description' => 'Scheduled 250-hour service per OEM manual',
                    'performed_by' => 'Al Rushaid Maintenance',
                    'next_service_due' => $maintenanceCursor->copy()->addDays(120)->toDateString(),
                ]);
                $maintenanceCursor = $maintenanceCursor->copy()->addDays(120);
            }
        }

        return $map;
    }

    /**
     * @param  array<string, WorkerRecord>  $workers
     */
    private function seedEvacuationReports(Site $site, array $workers, ?User $admin, IotWorkCalendar $calendar): void
    {
        $personnelTemplate = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('is_on_site', true)
            ->with(['worker:id,full_name,contractor', 'rfidZone:id,name'])
            ->get()
            ->map(fn (RfidTagLastSeen $row): array => [
                'tag_epc' => $row->tag_epc,
                'worker' => $row->worker?->full_name,
                'contractor' => $row->worker?->contractor,
                'last_zone' => $row->rfidZone?->name,
                'last_seen_at' => $row->last_seen_at->toIso8601String(),
            ]);

        $evacuationDates = IotScenarioCatalog::historicalEvacuationDates($calendar);

        foreach ($evacuationDates as $index => $generatedAt) {
            $at = Carbon::parse($generatedAt);
            $isLatest = $index === count($evacuationDates) - 1;

            EvacuationReport::query()->create([
                'site_id' => $site->id,
                'generated_by_user_id' => $admin?->id,
                'generated_at' => $at,
                'snapshot' => [
                    'on_site_count' => $personnelTemplate->count(),
                    'personnel' => $personnelTemplate->all(),
                    'drill_label' => 'Q'.(int) ceil($at->month / 3).' '.$at->format('Y'),
                ],
                'muster_status' => $personnelTemplate->values()->map(fn (array $p, int $i): array => [
                    'tag_epc' => $p['tag_epc'],
                    'status' => $isLatest && $i === $personnelTemplate->count() - 1
                        ? 'unaccounted'
                        : ($isLatest && $i >= (int) floor($personnelTemplate->count() * 0.7) ? 'unknown' : 'accounted'),
                    'muster_point' => $i < (int) floor($personnelTemplate->count() * 0.85) ? 'Muster Alpha' : null,
                ])->all(),
            ]);
        }
    }

    private function seedUdpmReports(Site $site, ?User $admin, ?User $hse, IotWorkCalendar $calendar): void
    {
        $service = app(UdpmWeeklyReportService::class);
        $week = $calendar->periodStart()->copy()->startOfWeek();
        $end = now()->startOfWeek();
        $weekIndex = 0;
        $fullServiceWeeks = (int) config('siteguard.iot_demo_seed.udpm_full_service_weeks', 2);
        $recentThreshold = now()->subWeeks($fullServiceWeeks)->startOfWeek();

        while ($week->lte($end)) {
            $status = match (true) {
                $week->isSameWeek(now()) => 'draft',
                $weekIndex % 9 === 0 => 'draft',
                default => 'approved',
            };

            if ($week->gte($recentThreshold)) {
                $result = $service->generate($site, $week, $admin?->id);
                $result['report']->update([
                    'status' => $status,
                    'approved_by_user_id' => $status === 'approved' ? $hse?->id : null,
                ]);
            } else {
                $weekEnd = $week->copy()->endOfWeek();
                $site->udpmWeeklyReports()->create([
                    'week_start' => $week->toDateString(),
                    'week_end' => $weekEnd->toDateString(),
                    'status' => $status,
                    'generated_at' => $weekEnd->copy()->setTime(16, 0),
                    'generated_by_user_id' => $admin?->id,
                    'approved_by_user_id' => $status === 'approved' ? $hse?->id : null,
                    'payload' => [
                        'site' => ['name' => $site->name, 'code' => $site->code],
                        'sections' => [
                            'headcount' => ['weekly_avg' => 12, 'peak' => 18],
                            'gas' => ['alarms' => $weekIndex % 11 === 0 ? 1 : 0],
                            'lsr' => ['violations' => 2 + ($weekIndex % 3)],
                        ],
                    ],
                    'compliance_summary' => [
                        'matrix_score_pct' => 78 + ($weekIndex % 15),
                        'open_actions' => $weekIndex % 4,
                    ],
                ]);
            }

            $week = $week->copy()->addWeek();
            $weekIndex++;
        }
    }

    private function seedDeploymentApprovals(Site $site, ?User $admin, ?User $hse, IotWorkCalendar $calendar): void
    {
        $types = array_keys(config('siteguard.deployment_approval_types', []));
        $milestones = [
            $calendar->periodStart()->copy()->addDays(21),
            $calendar->periodStart()->copy()->addMonths(6),
            $calendar->periodStart()->copy()->addMonths(12),
            now()->subDays(5),
        ];

        foreach ($milestones as $index => $submittedAt) {
            $type = $types[$index % count($types)] ?? 'cctv_gi';
            $approved = $index < count($milestones) - 1;

            DeploymentApproval::query()->create([
                'site_id' => $site->id,
                'approval_type' => $type,
                'status' => $approved ? 'approved' : 'submitted',
                'submitted_at' => $submittedAt,
                'approved_at' => $approved ? $submittedAt->copy()->addDays(4) : null,
                'submitted_by_user_id' => $admin?->id,
                'approved_by_user_id' => $approved ? $hse?->id : null,
                'notes' => 'Deployment approval — '.$type.' ('.$submittedAt->format('M Y').')',
            ]);
        }

        if (in_array('cctv_gi', $types, true)) {
            $settings = $site->settings ?? [];
            $settings['commissioning_gate'] = 'approved';
            $site->update(['settings' => $settings]);
        }
    }

    /**
     * @param  array<string, Alert>  $alerts
     */
    private function seedIotInvestigations(Site $site, array $alerts, ?User $hse): void
    {
        if ($site->code !== 'CTCF') {
            return;
        }

        $fallAlert = $alerts['hse-fall'] ?? null;

        if ($fallAlert === null) {
            return;
        }

        $investigation = Investigation::query()->create([
            'site_id' => $site->id,
            'title' => 'Correlated fall investigation — '.$fallAlert->title,
            'description' => 'Auto-seeded investigation linked to IoT fall and stationary tag alerts.',
            'status' => 'open',
            'opened_by_user_id' => $hse?->id,
            'assigned_user_id' => $hse?->id,
            'opened_at' => now()->subDay(),
        ]);

        $alertIds = array_filter([
            $fallAlert->id,
            ($alerts['rfid-003'] ?? null)?->id,
        ]);

        $investigation->alerts()->sync($alertIds);
    }
}
