<?php

namespace Tests\Feature\Ai;

use App\Models\Site;
use App\Support\SiteGuardAiIotDataService;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\DetectionModuleSeeder;
use Database\Seeders\IotLifecycleDemoSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SiteGuardAiIotDataServiceTest extends TestCase
{
    use RefreshDatabase;

    private Site $site;

    private SiteGuardAiIotDataService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            RolePermissionSeeder::class,
            DetectionModuleSeeder::class,
            DemoUserSeeder::class,
            IotLifecycleDemoSeeder::class,
        ]);

        $this->site = Site::query()->where('code', 'CTCF')->firstOrFail();
        $this->service = new SiteGuardAiIotDataService($this->site);
    }

    public function test_summary_returns_cross_module_kpis(): void
    {
        $summary = $this->service->summary();

        $this->assertArrayHasKey('rfid_ssms', $summary);
        $this->assertArrayHasKey('gas_environmental', $summary);
        $this->assertArrayHasKey('field_devices', $summary);
        $this->assertArrayHasKey('equipment', $summary);
        $this->assertArrayHasKey('hse_incidents', $summary);
        $this->assertArrayHasKey('lsr', $summary);
        $this->assertGreaterThan(0, $summary['on_site_headcount']);
    }

    public function test_rfid_ssms_domains_return_data(): void
    {
        $overview = $this->service->rfidSsms('overview');
        $this->assertArrayNotHasKey('error', $overview);

        $zones = $this->service->rfidSsms('zones');
        $this->assertNotEmpty($zones['zones'] ?? []);

        $onSite = $this->service->rfidSsms('on_site_personnel');
        $this->assertGreaterThan(0, $onSite['count'] ?? 0);

        $gateLog = $this->service->rfidSsms('gate_log', days: 30);
        $this->assertGreaterThan(0, $gateLog['count'] ?? 0);
    }

    public function test_gas_environmental_domains_return_data(): void
    {
        $summary = $this->service->gasEnvironmental('summary');
        $this->assertArrayNotHasKey('error', $summary);

        $readings = $this->service->gasEnvironmental('latest_readings');
        $this->assertGreaterThan(0, $readings['count'] ?? 0);

        $sensors = $this->service->gasEnvironmental('environmental_sensors');
        $this->assertGreaterThan(0, $sensors['count'] ?? 0);
    }

    public function test_field_devices_equipment_and_compliance_queries(): void
    {
        $devices = $this->service->fieldDevices();
        $this->assertGreaterThan(0, $devices['count']);

        $assets = $this->service->equipmentAssets();
        $this->assertGreaterThan(0, $assets['count']);

        $hse = $this->service->hseIncidents();
        $this->assertGreaterThan(0, $hse['count']);

        $lsr = $this->service->lsrViolations();
        $this->assertGreaterThan(0, $lsr['lsr_violations_count']);

        $udpm = $this->service->udpmReports();
        $this->assertGreaterThan(0, $udpm['count']);
    }
}
