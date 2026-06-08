<?php

namespace Tests\Feature\Seeders;

use App\Models\EquipmentAsset;
use App\Models\EvacuationReport;
use App\Models\GasReading;
use App\Models\GateEntryExitLog;
use App\Models\HseIncident;
use App\Models\LsrViolationLog;
use App\Models\RfidReader;
use App\Models\RfidTagLastSeen;
use App\Models\Site;
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
        $this->assertGreaterThanOrEqual(10, WorkerRecord::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThan(50, GateEntryExitLog::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThan(0, RfidTagLastSeen::query()->where('site_id', $site->id)->where('is_on_site', true)->count());
        $this->assertGreaterThan(100, GasReading::query()->where('site_id', $site->id)->count());
        $this->assertSame(5, EquipmentAsset::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(3, HseIncident::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(5, LsrViolationLog::query()->where('site_id', $site->id)->count());
        $this->assertSame(2, EvacuationReport::query()->where('site_id', $site->id)->count());
        $this->assertGreaterThanOrEqual(2, UdpmWeeklyReport::query()->where('site_id', $site->id)->count());
    }
}
