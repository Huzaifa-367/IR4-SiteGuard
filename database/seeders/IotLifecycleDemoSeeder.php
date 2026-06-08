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
use App\Models\GasReading;
use App\Models\GateEntryExitLog;
use App\Models\IngestApiToken;
use App\Models\Investigation;
use App\Models\RfidReader;
use App\Models\RfidReadEvent;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\Rule;
use App\Models\SensorAlarm;
use App\Models\SensorDevice;
use App\Models\SensorReading;
use App\Models\Site;
use App\Models\SiteHeadcountSnapshot;
use App\Models\User;
use App\Models\WorkerRecord;
use App\Services\Ingest\IngestTokenService;
use App\Services\Reports\UdpmWeeklyReportService;
use App\Support\DefaultSiteRules;
use Database\Seeders\Support\IotScenarioCatalog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class IotLifecycleDemoSeeder extends Seeder
{
    private const int HISTORY_DAYS = 14;

    /**
     * @var Collection<string, DetectionModule>
     */
    private Collection $modules;

    public function run(): void
    {
        $this->modules = DetectionModule::query()->get()->keyBy('key');

        $admin = User::query()->where('email', 'admin@siteguard.test')->first();
        $hse = User::query()->where('email', 'hse@siteguard.test')->first();
        $supervisor = User::query()->where('email', 'supervisor@siteguard.test')->first();
        $operator = User::query()->where('email', 'scc_operator@siteguard.test')->first();
        $viewer = User::query()->where('email', 'viewer@siteguard.test')->first();
        $siteStaff = User::query()->where('email', 'site_staff@siteguard.test')->first();

        foreach (IotScenarioCatalog::sites() as $siteDef) {
            $site = $this->ensureSite($siteDef, $admin, $hse, $supervisor, $operator, $viewer, $siteStaff);
            $this->clearIotData($site);
            $this->seedSiteLifecycle($site, $siteDef['scale'], $admin, $hse);
        }
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
        foreach ($siteUsers as $user) {
            $site->users()->syncWithoutDetaching([
                $user->id => ['is_primary' => $user->id === $supervisor?->id && $siteDef['code'] === 'DEMO-01'],
            ]);
        }

        return $site;
    }

    private function clearIotData(Site $site): void
    {
        $iotAlertIds = Alert::query()
            ->where('site_id', $site->id)
            ->whereNull('camera_id')
            ->pluck('id');

        SensorAlarm::query()->where('site_id', $site->id)->delete();
        Alert::query()->whereIn('id', $iotAlertIds)->delete();

        EquipmentQrScan::query()->whereIn('equipment_asset_id', $site->equipmentAssets()->pluck('id'))->delete();
        EquipmentDocument::query()->whereIn('equipment_asset_id', $site->equipmentAssets()->pluck('id'))->delete();
        EquipmentInspection::query()->whereIn('equipment_asset_id', $site->equipmentAssets()->pluck('id'))->delete();
        EquipmentMaintenanceRecord::query()->whereIn('equipment_asset_id', $site->equipmentAssets()->pluck('id'))->delete();
        $site->equipmentAssets()->delete();

        $site->udpmWeeklyReports()->delete();
        $site->vehicleViolationLogs()->delete();
        $site->lsrViolationLogs()->delete();
        $site->hseIncidents()->delete();
        $site->evacuationReports()->delete();

        $site->sensorReadings()->delete();
        $site->gasReadings()->delete();
        $site->gateEntryExitLogs()->delete();
        RfidReadEvent::query()->where('site_id', $site->id)->delete();
        RfidTagLastSeen::query()->where('site_id', $site->id)->delete();
        $site->siteHeadcountSnapshots()->delete();
        $site->workerRecords()->delete();

        $deviceIds = collect()
            ->merge($site->rfidReaders()->pluck('id'))
            ->merge($site->gasGateways()->pluck('id'))
            ->merge($site->sensorDevices()->pluck('id'))
            ->merge($site->edgeDevices()->pluck('id'));

        IngestApiToken::query()
            ->whereIn('tokenable_id', $deviceIds)
            ->whereIn('tokenable_type', [
                (new EdgeDevice)->getMorphClass(),
                (new RfidReader)->getMorphClass(),
                (new GasGateway)->getMorphClass(),
                (new SensorDevice)->getMorphClass(),
            ])
            ->delete();

        $site->gasGateways()->delete();
        $site->sensorDevices()->delete();
        $site->rfidReaders()->delete();
        $site->rfidZones()->delete();
        $site->edgeDevices()->delete();
    }

    private function seedSiteLifecycle(Site $site, float $scale, ?User $admin, ?User $hse): void
    {
        $tokenService = app(IngestTokenService::class);
        $siteSeed = crc32($site->code);

        $edges = $this->seedEdgeDevices($site, $tokenService, $admin);
        $zones = $this->seedRfidZones($site);
        $readers = $this->seedRfidReaders($site, $zones, $edges, $tokenService, $admin);
        $gateways = $this->seedGasGateways($site, $edges, $tokenService, $admin);
        $sensors = $this->seedSensorDevices($site, $edges, $tokenService, $admin);

        $workers = $this->seedWorkers($site, $zones, $scale);
        $this->seedGateLifecycle($site, $readers['gate-main'], $workers, $scale);
        $this->seedZoneReadEvents($site, $readers, $workers, $scale);
        $this->rebuildTagLastSeen($site, $readers, $workers);

        $this->seedGasReadings($site, $gateways, $scale, $siteSeed);
        $this->seedEnvironmentalReadings($site, $sensors, $scale, $siteSeed);
        $this->seedHeadcountSnapshots($site, $scale);

        $alerts = $this->seedIotAlerts($site, $zones, $workers, $gateways);
        $this->seedLsrViolations($site, $alerts, $hse);
        $this->seedHseIncidents($site, $zones, $alerts, $hse);
        $this->seedVehicleViolations($site, $hse);

        $assets = $this->seedEquipmentLifecycle($site, $admin, $hse);
        $this->seedEvacuationReports($site, $workers, $admin);
        $this->seedUdpmReports($site, $admin, $hse);
        $this->seedDeploymentApprovals($site, $admin, $hse);
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
     * @param  array<string, WorkerRecord>  $workers
     */
    private function seedGateLifecycle(Site $site, RfidReader $gateReader, array $workers, float $scale): void
    {
        $workerList = array_values($workers);
        $onSiteState = [];

        for ($dayOffset = self::HISTORY_DAYS; $dayOffset >= 0; $dayOffset--) {
            $day = now()->subDays($dayOffset)->startOfDay();
            if ($day->isWeekend() && $scale < 1.0) {
                continue;
            }

            $entriesThisDay = (int) round((8 + ($dayOffset % 4)) * $scale);
            for ($i = 0; $i < $entriesThisDay; $i++) {
                $worker = $workerList[($dayOffset + $i) % count($workerList)];
                $entryAt = $day->copy()->setTime(6, 15 + ($i % 45), 0);

                GateEntryExitLog::query()->create([
                    'site_id' => $site->id,
                    'tag_epc' => $worker->tag_epc,
                    'worker_record_id' => $worker->id,
                    'direction' => 'entry',
                    'occurred_at' => $entryAt,
                    'gate_reader_id' => $gateReader->id,
                ]);
                $onSiteState[$worker->tag_epc] = ['worker' => $worker, 'at' => $entryAt, 'on_site' => true];

                if ($dayOffset > 0 || ($dayOffset === 0 && $i < $entriesThisDay - 3)) {
                    $exitAt = $day->copy()->setTime(16, 30 + ($i % 50), 0);
                    if ($exitAt->isFuture()) {
                        continue;
                    }
                    GateEntryExitLog::query()->create([
                        'site_id' => $site->id,
                        'tag_epc' => $worker->tag_epc,
                        'worker_record_id' => $worker->id,
                        'direction' => 'exit',
                        'occurred_at' => $exitAt,
                        'gate_reader_id' => $gateReader->id,
                    ]);
                    $onSiteState[$worker->tag_epc]['on_site'] = false;
                }
            }
        }

        foreach (IotScenarioCatalog::workers() as $def) {
            if (! isset($workers[$def['tag_epc']])) {
                continue;
            }
            if (! $def['on_site_default']) {
                continue;
            }
            $worker = $workers[$def['tag_epc']];
            if (($onSiteState[$worker->tag_epc]['on_site'] ?? false) === false) {
                GateEntryExitLog::query()->create([
                    'site_id' => $site->id,
                    'tag_epc' => $worker->tag_epc,
                    'worker_record_id' => $worker->id,
                    'direction' => 'entry',
                    'occurred_at' => now()->subHours(2),
                    'gate_reader_id' => $gateReader->id,
                ]);
            }
        }
    }

    /**
     * @param  array<string, RfidReader>  $readers
     * @param  array<string, WorkerRecord>  $workers
     */
    private function seedZoneReadEvents(Site $site, array $readers, array $workers, float $scale): void
    {
        $gateReader = $readers['gate-main'];

        foreach ($readers as $code => $reader) {
            if ($reader->mount_type === 'gate') {
                continue;
            }

            $batchId = (string) Str::uuid();
            $readAt = now()->subMinutes(5);

            foreach (array_slice(array_values($workers), 0, (int) round(5 * $scale)) as $worker) {
                RfidReadEvent::query()->create([
                    'site_id' => $site->id,
                    'rfid_reader_id' => $reader->id,
                    'rfid_zone_id' => $reader->rfid_zone_id,
                    'tag_epc' => $worker->tag_epc,
                    'worker_record_id' => $worker->id,
                    'rssi' => -48 - (crc32($worker->tag_epc) % 20),
                    'read_at' => $readAt,
                    'batch_id' => $batchId,
                ]);
            }
        }
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
     * @param  array<string, GasGateway>  $gateways
     */
    private function seedGasReadings(Site $site, array $gateways, float $scale, int $siteSeed): void
    {
        $thresholds = config('siteguard.gas_thresholds');

        foreach ($gateways as $code => $gateway) {
            for ($hour = 168; $hour >= 0; $hour -= 2) {
                $readAt = now()->subHours($hour);
                $lel = 2.5 + (($siteSeed + $hour) % 8);
                $alarmState = 'normal';
                $alarmGases = [];

                if ($code === 'gas-gw-vehicle-02' && $hour === 72) {
                    $lel = 22.4;
                    $alarmState = 'high_alarm';
                    $alarmGases = ['lel_pct'];
                }

                GasReading::query()->create([
                    'site_id' => $site->id,
                    'gas_gateway_id' => $gateway->id,
                    'lel_pct' => round($lel, 2),
                    'o2_pct' => round(20.8 + (($hour % 5) / 10), 2),
                    'h2s_ppm' => round(0.5 + ($hour % 3), 2),
                    'co_ppm' => round(2 + ($hour % 4), 2),
                    'alarm_state' => $alarmState,
                    'alarm_gases' => $alarmGases,
                    'poll_type' => 'scheduled',
                    'detector_serial' => 'BW-'.strtoupper(substr($code, -2)).'-2024',
                    'read_at' => $readAt,
                    'event_id' => (string) Str::uuid(),
                ]);
            }
        }

        $gw2 = $gateways['gas-gw-vehicle-02'] ?? null;
        if ($gw2 !== null) {
            SensorAlarm::query()->create([
                'site_id' => $site->id,
                'source_type' => GasGateway::class,
                'source_id' => $gw2->id,
                'parameter' => 'lel_pct',
                'value' => 22.4,
                'threshold' => $thresholds['lel_pct']['high'],
                'severity' => 'critical',
                'alarm_at' => now()->subDays(3)->setTime(14, 22),
                'cleared_at' => now()->subDays(3)->setTime(15, 10),
            ]);

            SensorAlarm::query()->create([
                'site_id' => $site->id,
                'source_type' => GasGateway::class,
                'source_id' => $gw2->id,
                'parameter' => 'lel_pct',
                'value' => 11.2,
                'threshold' => $thresholds['lel_pct']['low'],
                'severity' => 'high',
                'alarm_at' => now()->subHours(2),
                'cleared_at' => null,
            ]);
        }
    }

    /**
     * @param  array<string, SensorDevice>  $sensors
     */
    private function seedEnvironmentalReadings(Site $site, array $sensors, float $scale, int $siteSeed): void
    {
        foreach ($sensors as $sensor) {
            for ($hour = 72; $hour >= 0; $hour -= 3) {
                $readAt = now()->subHours($hour);
                $params = $sensor->device_type === 'co2_ndir'
                    ? [['parameter' => 'co2_ppm', 'value' => 420 + ($hour % 20), 'unit' => 'ppm']]
                    : [
                        ['parameter' => 'temp_c', 'value' => 34 + (($siteSeed + $hour) % 8), 'unit' => 'C'],
                        ['parameter' => 'humidity_pct', 'value' => 45 + ($hour % 15), 'unit' => '%'],
                        ['parameter' => 'wind_speed_mps', 'value' => 2.5 + ($hour % 5), 'unit' => 'm/s'],
                    ];

                foreach ($params as $row) {
                    SensorReading::query()->create([
                        'site_id' => $site->id,
                        'sensor_device_id' => $sensor->id,
                        'parameter' => $row['parameter'],
                        'value' => $row['value'],
                        'unit' => $row['unit'],
                        'quality' => 'good',
                        'assurance_tier' => 'instrumented',
                        'read_at' => $readAt,
                        'event_id' => (string) Str::uuid(),
                    ]);
                }
            }
        }
    }

    private function seedHeadcountSnapshots(Site $site, float $scale): void
    {
        for ($day = self::HISTORY_DAYS; $day >= 0; $day--) {
            $recordedAt = now()->subDays($day)->setTime(12, 0);
            $onSite = RfidTagLastSeen::query()
                ->where('site_id', $site->id)
                ->where('is_on_site', true)
                ->count();

            $byZone = RfidTagLastSeen::query()
                ->where('site_id', $site->id)
                ->where('is_on_site', true)
                ->selectRaw('rfid_zone_id, count(*) as total')
                ->groupBy('rfid_zone_id')
                ->pluck('total', 'rfid_zone_id');

            SiteHeadcountSnapshot::query()->create([
                'site_id' => $site->id,
                'recorded_at' => $recordedAt,
                'on_site_count' => (int) round($onSite * (0.85 + ($day % 3) * 0.05) * max(0.5, $scale)),
                'by_zone' => $byZone->all(),
                'source' => 'gate',
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
    private function seedLsrViolations(Site $site, array $alerts, ?User $hse): void
    {
        $alertMap = [
            'LSR-RZ-001' => $alerts['rfid-001'] ?? null,
            'LSR-OC-001' => $alerts['rfid-002'] ?? null,
            'LSR-WD-001' => $alerts['rfid-003'] ?? null,
            'LSR-GAS-001' => $alerts['gas-001'] ?? null,
        ];

        foreach (IotScenarioCatalog::lsrViolations() as $def) {
            $alert = $alertMap[$def['lsr_category']] ?? null;

            $site->lsrViolationLogs()->create([
                'lsr_category' => $def['lsr_category'],
                'detection_mode' => $def['detection_mode'],
                'occurred_at' => now()->subDays($def['days_ago'])->setTime(10, 0),
                'alert_id' => $alert?->id,
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
    private function seedHseIncidents(Site $site, array $zones, array $alerts, ?User $hse): void
    {
        foreach (IotScenarioCatalog::hseIncidents() as $def) {
            $fallAlert = $alerts['hse-fall'] ?? null;
            $stationaryAlert = $alerts['rfid-003'] ?? null;

            $alertIds = match (true) {
                ($def['correlated'] ?? false) && $fallAlert && $stationaryAlert => [$fallAlert->id, $stationaryAlert->id],
                $def['incident_type'] === 'fall_correlated' && $fallAlert => [$fallAlert->id],
                $def['incident_type'] === 'stationary_tag' && $stationaryAlert => [$stationaryAlert->id],
                default => [],
            };

            $site->hseIncidents()->create([
                'incident_number' => $def['incident_number'],
                'status' => $def['status'],
                'severity' => $def['severity'],
                'incident_type' => $def['incident_type'],
                'occurred_at' => now()->subDays($def['days_ago'])->setTime(11, 0),
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
                'classified_at' => $def['classified'] ? now()->subDays($def['days_ago'])->addHours(4) : null,
            ]);
        }
    }

    private function seedVehicleViolations(Site $site, ?User $hse): void
    {
        $loggerId = $hse?->id ?? User::query()->value('id');
        if ($loggerId === null) {
            return;
        }

        $equipment = $site->equipmentAssets()->where('equipment_type', 'vehicle')->first();

        foreach (IotScenarioCatalog::vehicleViolations() as $def) {
            $site->vehicleViolationLogs()->create([
                'occurred_at' => now()->subDays($def['days_ago'])->setTime(15, 30),
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
    private function seedEquipmentLifecycle(Site $site, ?User $admin, ?User $hse): array
    {
        $map = [];
        $reportService = app(UdpmWeeklyReportService::class);

        foreach (IotScenarioCatalog::equipment() as $def) {
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
                'registered_at' => now()->subMonths(3),
            ]);
            $map[$def['equipment_id']] = $asset;

            EquipmentInspection::query()->create([
                'equipment_asset_id' => $asset->id,
                'inspected_at' => now()->subDays(14)->toDateString(),
                'inspector_name' => 'Khalid Al-Otaibi',
                'outcome' => $def['status'] === 'out_of_service' ? 'fail' : 'pass',
                'notes' => $def['status'] === 'out_of_service' ? 'Hydraulic leak — out of service until repair' : 'Visual and functional check OK',
                'next_inspection_due' => now()->addDays(30)->toDateString(),
                'created_by_user_id' => $hse?->id,
            ]);

            EquipmentMaintenanceRecord::query()->create([
                'equipment_asset_id' => $asset->id,
                'performed_at' => now()->subDays(45)->toDateString(),
                'maintenance_type' => 'preventive',
                'description' => 'Scheduled 250-hour service per OEM manual',
                'performed_by' => 'Al Rushaid Maintenance',
                'next_service_due' => now()->addDays(60)->toDateString(),
            ]);

            EquipmentDocument::query()->create([
                'equipment_asset_id' => $asset->id,
                'document_type' => 'manual',
                'title' => $def['name'].' — Operator manual',
                'external_url' => 'https://siteguard.local/manuals/'.Str::slug($def['equipment_id']).'.pdf',
                'uploaded_at' => now()->subMonths(2),
            ]);

            for ($scan = 0; $scan < 3; $scan++) {
                EquipmentQrScan::query()->create([
                    'equipment_asset_id' => $asset->id,
                    'scanned_at' => now()->subDays(10 - $scan * 3),
                    'ip_address' => '10.20.1.'.(100 + $scan),
                    'user_agent' => 'Mozilla/5.0 (iPhone; Mobile) SiteWiFi',
                ]);
            }
        }

        return $map;
    }

    /**
     * @param  array<string, WorkerRecord>  $workers
     */
    private function seedEvacuationReports(Site $site, array $workers, ?User $admin): void
    {
        $onSite = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('is_on_site', true)
            ->with(['worker:id,full_name,contractor', 'rfidZone:id,name'])
            ->get();

        $personnel = $onSite->map(fn (RfidTagLastSeen $row): array => [
            'tag_epc' => $row->tag_epc,
            'worker' => $row->worker?->full_name,
            'contractor' => $row->worker?->contractor,
            'last_zone' => $row->rfidZone?->name,
            'last_seen_at' => $row->last_seen_at->toIso8601String(),
        ]);

        EvacuationReport::query()->create([
            'site_id' => $site->id,
            'generated_by_user_id' => $admin?->id,
            'generated_at' => now()->subDays(7)->setTime(9, 30),
            'snapshot' => [
                'on_site_count' => $personnel->count(),
                'personnel' => $personnel->all(),
            ],
            'muster_status' => $personnel->map(fn (array $p): array => [
                'tag_epc' => $p['tag_epc'],
                'status' => 'accounted',
                'muster_point' => 'Muster Alpha',
            ])->all(),
        ]);

        EvacuationReport::query()->create([
            'site_id' => $site->id,
            'generated_by_user_id' => $admin?->id,
            'generated_at' => now()->subHours(1),
            'snapshot' => [
                'on_site_count' => $personnel->count(),
                'personnel' => $personnel->all(),
            ],
            'muster_status' => $personnel->values()->map(fn (array $p, int $i): array => [
                'tag_epc' => $p['tag_epc'],
                'status' => $i < (int) floor($personnel->count() * 0.7) ? 'accounted' : ($i === $personnel->count() - 1 ? 'unaccounted' : 'unknown'),
                'muster_point' => $i < (int) floor($personnel->count() * 0.7) ? 'Muster Alpha' : null,
            ])->all(),
        ]);
    }

    private function seedUdpmReports(Site $site, ?User $admin, ?User $hse): void
    {
        $service = app(UdpmWeeklyReportService::class);

        $lastWeek = $service->generate($site, now()->subWeek()->startOfWeek(), $admin?->id);
        $lastWeek['report']->update([
            'status' => 'approved',
            'approved_by_user_id' => $hse?->id,
        ]);

        $service->generate($site, now()->startOfWeek(), $admin?->id);
    }

    private function seedDeploymentApprovals(Site $site, ?User $admin, ?User $hse): void
    {
        $types = array_keys(config('siteguard.deployment_approval_types', []));

        foreach (array_slice($types, 0, 2) as $index => $type) {
            DeploymentApproval::query()->create([
                'site_id' => $site->id,
                'approval_type' => $type,
                'status' => $index === 0 ? 'approved' : 'submitted',
                'submitted_at' => now()->subDays(5 - $index),
                'approved_at' => $index === 0 ? now()->subDays(3) : null,
                'submitted_by_user_id' => $admin?->id,
                'approved_by_user_id' => $index === 0 ? $hse?->id : null,
                'notes' => 'Demo approval for '.$type,
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
