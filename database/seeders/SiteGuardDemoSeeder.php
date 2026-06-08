<?php

namespace Database\Seeders;

use App\Models\Camera;
use App\Models\DetectionModule;
use App\Models\Rule;
use App\Models\Site;
use App\Models\User;
use App\Models\Zone;
use App\Services\Ingest\IngestTokenService;
use Illuminate\Database\Seeder;

class SiteGuardDemoSeeder extends Seeder
{
    public function run(): void
    {
        $ppe = DetectionModule::query()->firstOrCreate(
            ['key' => 'ppe'],
            ['name' => 'PPE compliance', 'description' => 'Helmet, vest, and PPE detection.'],
        );

        $site = Site::query()->firstOrCreate(
            ['code' => 'DEMO-01'],
            [
                'name' => 'Riverside Tower — Demo',
                'timezone' => 'Asia/Dubai',
                'address' => 'Demo construction site',
                'status' => 'active',
            ],
        );

        $site->detectionModules()->syncWithoutDetaching([
            $ppe->id => ['is_enabled' => true],
        ]);

        $supervisor = User::query()->where('email', 'supervisor@siteguard.test')->first();
        if ($supervisor !== null) {
            $site->users()->syncWithoutDetaching([
                $supervisor->id => ['is_primary' => true],
            ]);
        }

        $camera = Camera::query()->firstOrCreate(
            ['site_id' => $site->id, 'code' => 'GATE-01'],
            [
                'detection_module_id' => $ppe->id,
                'name' => 'Main gate — PPE',
                'location_label' => 'Site entrance',
                'is_active' => true,
                'health_status' => 'offline',
            ],
        );

        $rule = Rule::query()->firstOrCreate(
            ['site_id' => $site->id, 'code' => 'PPE-001'],
            [
                'detection_module_id' => $ppe->id,
                'name' => 'Missing helmet',
                'severity' => 'high',
                'definition' => ['match' => 'no_helmet', 'min_confidence' => 0.8],
                'cooldown_sec' => 120,
                'is_active' => true,
            ],
        );

        $zone = Zone::query()->firstOrCreate(
            ['camera_id' => $camera->id, 'name' => 'Entrance lane'],
            [
                'site_id' => $site->id,
                'polygon' => [
                    ['x' => 0.1, 'y' => 0.1],
                    ['x' => 0.9, 'y' => 0.1],
                    ['x' => 0.9, 'y' => 0.9],
                    ['x' => 0.1, 'y' => 0.9],
                ],
                'zone_type' => 'restricted',
                'is_active' => true,
            ],
        );

        $zone->rules()->syncWithoutDetaching([$rule->id]);

        $admin = User::query()->where('email', 'admin@siteguard.test')->first();
        if ($admin !== null && $camera->ingestToken === null) {
            app(IngestTokenService::class)->issueForCamera($camera, $admin, 'Demo ingest token');
        }

    }
}
