<?php

namespace Tests\Feature\Seeders;

use App\Models\EquipmentAsset;
use App\Models\EquipmentInspection;
use App\Models\EvacuationReport;
use App\Models\GasReading;
use App\Models\GateEntryExitLog;
use App\Models\HseIncident;
use App\Models\LsrViolationLog;
use App\Models\RfidReader;
use App\Models\RfidReadEvent;
use App\Models\RfidTagLastSeen;
use App\Models\SensorReading;
use App\Models\Site;
use App\Models\SiteHeadcountSnapshot;
use App\Models\UdpmWeeklyReport;
use App\Models\WorkerRecord;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\DetectionModuleSeeder;
use Database\Seeders\IotLifecycleDemoSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IotLifecycleDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_populates_central_tcf_with_full_iot_lifecycle(): void
    {
        $this->seed([
            RolePermissionSeeder::class,
            DetectionModuleSeeder::class,
            DemoUserSeeder::class,
            IotLifecycleDemoSeeder::class,
        ]);

        $site = Site::query()->where('code', 'CTCF')->firstOrFail();

        $this->assertSame(8, RfidReader::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(18, WorkerRecord::query()->where('site_id', $site->id)->count());

        $gateLogs = GateEntryExitLog::query()->where('site_id', $site->id)->count();
        $this->assertGreaterThan(1_000, $gateLogs);
        $this->assertGreaterThan(0, RfidTagLastSeen::query()->where('site_id', $site->id)->where('is_on_site', true)->count());
        $this->assertGreaterThan(1_000, RfidReadEvent::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThan(1_000, GasReading::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThan(500, SensorReading::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThan(20, SiteHeadcountSnapshot::query()->where('site_id', $site->id)->count());

        $this->assertSame(5, EquipmentAsset::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(3, EquipmentInspection::query()->whereIn('equipment_asset_id', $site->equipmentAssets()->pluck('id'))->count());

        $this->assertGreaterThanOrEqual(3, HseIncident::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(15, LsrViolationLog::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(1, EvacuationReport::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(6, UdpmWeeklyReport::query()->where('site_id', $site->id)->count());

        $oldestGate = GateEntryExitLog::query()->where('site_id', $site->id)->orderBy('occurred_at')->value('occurred_at');
        $this->assertTrue($oldestGate->lt(now()->subDays(30)));
    }
}
