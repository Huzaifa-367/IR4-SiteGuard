<?php

namespace Tests\Feature\Reports;

use App\Models\EquipmentAsset;
use App\Models\Site;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaExportBlockedTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
    }

    public function test_sa_representative_cannot_export_reports(): void
    {
        $user = User::factory()->create();
        $user->assignRole('sa_representative');

        $this->actingAs($user)
            ->get(route('reports.alerts.export'))
            ->assertForbidden();
    }

    public function test_equipment_scan_is_logged(): void
    {
        $site = Site::query()->create([
            'name' => 'Test Site',
            'code' => 'TEST',
            'timezone' => 'Asia/Riyadh',
            'status' => 'active',
        ]);

        $asset = EquipmentAsset::query()->create([
            'site_id' => $site->id,
            'equipment_id' => 'EQ-001',
            'name' => 'Test Crane',
            'equipment_type' => 'crane',
            'status' => 'active',
            'qr_slug' => 'testslug1234',
            'registered_at' => now(),
        ]);

        $this->get(route('equipment.scan', $asset->qr_slug))->assertOk();

        $this->assertDatabaseHas('equipment_qr_scans', [
            'equipment_asset_id' => $asset->id,
        ]);
    }
}
