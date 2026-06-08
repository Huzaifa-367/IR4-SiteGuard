<?php

namespace App\Support;

use App\Models\DetectionModule;
use App\Models\Site;

class DefaultSiteRules
{
    public static function seedFor(Site $site): void
    {
        $modules = DetectionModule::query()
            ->whereIn('key', ['rfid_ssms', 'gas_monitoring', 'environmental', 'incident_vision'])
            ->get()
            ->keyBy('key');

        $rules = [
            [
                'module' => 'rfid_ssms',
                'code' => 'RFID-001',
                'name' => 'Unauthorized restricted zone entry',
                'severity' => 'critical',
                'definition' => ['match' => 'rfid_unauthorized_zone'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'rfid_ssms',
                'code' => 'RFID-002',
                'name' => 'Zone occupancy exceeded',
                'severity' => 'high',
                'definition' => ['match' => 'rfid_zone_occupancy'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'rfid_ssms',
                'code' => 'RFID-003',
                'name' => 'Stationary tag alert',
                'severity' => 'high',
                'definition' => ['match' => 'rfid_stationary_tag'],
                'dwell_sec' => 1200,
                'cooldown_sec' => 600,
            ],
            [
                'module' => 'rfid_ssms',
                'code' => 'RFID-004',
                'name' => 'Unknown RFID tag on site',
                'severity' => 'medium',
                'definition' => ['match' => 'rfid_unknown_epc'],
                'cooldown_sec' => 600,
            ],
            [
                'module' => 'rfid_ssms',
                'code' => 'RFID-005',
                'name' => 'Unapproved portable device on site',
                'severity' => 'medium',
                'definition' => ['match' => 'rfid_unapproved_portable'],
                'cooldown_sec' => 600,
            ],
            [
                'module' => 'gas_monitoring',
                'code' => 'GAS-001',
                'name' => 'LEL threshold exceeded',
                'severity' => 'critical',
                'definition' => ['match' => 'gas_lel_high'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'gas_monitoring',
                'code' => 'GAS-002',
                'name' => 'O₂ out of range',
                'severity' => 'critical',
                'definition' => ['match' => 'gas_o2_out_of_range'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'gas_monitoring',
                'code' => 'GAS-003',
                'name' => 'H₂S threshold exceeded',
                'severity' => 'critical',
                'definition' => ['match' => 'gas_h2s_high'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'gas_monitoring',
                'code' => 'GAS-004',
                'name' => 'CO threshold exceeded',
                'severity' => 'critical',
                'definition' => ['match' => 'gas_co_high'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'environmental',
                'code' => 'ENV-001',
                'name' => 'CO₂ threshold exceeded',
                'severity' => 'high',
                'definition' => ['match' => 'env_co2_high'],
                'cooldown_sec' => 300,
            ],
            [
                'module' => 'incident_vision',
                'code' => 'HSE-V-001',
                'name' => 'Fall detected in work zone',
                'severity' => 'critical',
                'definition' => ['match' => 'fall_detected'],
                'cooldown_sec' => 60,
            ],
            [
                'module' => 'incident_vision',
                'code' => 'HSE-V-002',
                'name' => 'Person prone sustained',
                'severity' => 'high',
                'definition' => ['match' => 'person_prone'],
                'dwell_sec' => 10,
                'cooldown_sec' => 120,
            ],
        ];

        foreach ($rules as $rule) {
            $module = $modules->get($rule['module']);

            if ($module === null) {
                continue;
            }

            $site->rules()->firstOrCreate(
                ['code' => $rule['code']],
                [
                    'detection_module_id' => $module->id,
                    'name' => $rule['name'],
                    'severity' => $rule['severity'],
                    'definition' => $rule['definition'],
                    'dwell_sec' => $rule['dwell_sec'] ?? null,
                    'cooldown_sec' => $rule['cooldown_sec'] ?? null,
                    'is_active' => true,
                ],
            );
        }
    }
}
