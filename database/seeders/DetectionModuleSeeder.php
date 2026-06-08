<?php

namespace Database\Seeders;

use App\Models\DetectionModule;
use Illuminate\Database\Seeder;

class DetectionModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            ['key' => 'ppe', 'name' => 'PPE compliance', 'description' => 'Helmet, vest, and PPE detection.'],
            ['key' => 'vehicle_proximity', 'name' => 'Vehicle proximity', 'description' => 'Person–vehicle distance and collision risk.'],
            ['key' => 'working_at_height', 'name' => 'Working at height', 'description' => 'Fall risk and harness compliance.'],
        ];

        foreach ($modules as $module) {
            DetectionModule::query()->firstOrCreate(
                ['key' => $module['key']],
                ['name' => $module['name'], 'description' => $module['description']],
            );
        }
    }
}
