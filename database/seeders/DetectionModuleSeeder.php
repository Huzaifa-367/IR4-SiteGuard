<?php

namespace Database\Seeders;

use App\Models\DetectionModule;
use Illuminate\Database\Seeder;

class DetectionModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            ['key' => 'ppe', 'name' => 'PPE compliance', 'description' => 'Helmet, vest, mask, and PPE detection.'],
            ['key' => 'vehicle_proximity', 'name' => 'Vehicle proximity', 'description' => 'Person–vehicle distance and collision risk.'],
            ['key' => 'working_at_height', 'name' => 'Working at height', 'description' => 'Fall risk and harness compliance.'],
            ['key' => 'incident_vision', 'name' => 'Fall & incapacitation', 'description' => 'Camera-based fall and worker-down detection.'],
            ['key' => 'rfid_ssms', 'name' => 'RFID / SSMS', 'description' => 'Personnel tracking, headcount, and evacuation.'],
            ['key' => 'gas_monitoring', 'name' => 'Gas monitoring', 'description' => 'LEL, O₂, H₂S, and CO from vehicle detectors.'],
            ['key' => 'environmental', 'name' => 'Environmental', 'description' => 'CO₂, weather, and air quality sensors.'],
            ['key' => 'qr_equipment', 'name' => 'QR equipment', 'description' => 'Equipment registry and QR scan records.'],
            ['key' => 'hse_incidents', 'name' => 'HSE incidents', 'description' => 'Incident detection and classification.'],
            ['key' => 'lsr', 'name' => 'Life Saving Rules', 'description' => 'LSR violation logging and actions.'],
        ];

        foreach ($modules as $module) {
            DetectionModule::query()->firstOrCreate(
                ['key' => $module['key']],
                ['name' => $module['name'], 'description' => $module['description']],
            );
        }
    }
}
