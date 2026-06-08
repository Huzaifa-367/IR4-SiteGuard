<?php

namespace Database\Seeders\Support;

/**
 * Real-life IR4 deployment scenarios — Central & South TCF (UDPM-GM-0058).
 *
 * Topology per site (IR4 §7): 3 vehicle edge units, 4 pole readers, 1 gate reader,
 * 3 gas gateways (Honeywell BW GasAlertMicroClip XL), 3 CO₂ / RS485 sensor packs.
 */
class IotScenarioCatalog
{
    /**
     * @return list<array{code: string, name: string, timezone: string, address: string, lat: float, lng: float, scale: float}>
     */
    public static function sites(): array
    {
        return [
            [
                'code' => 'CTCF',
                'name' => 'Central TCF',
                'timezone' => 'Asia/Riyadh',
                'address' => 'Central Training & Competency Facility — Jubail Industrial City',
                'lat' => 27.0048,
                'lng' => 49.6582,
                'scale' => 1.0,
            ],
            [
                'code' => 'STCF',
                'name' => 'South TCF',
                'timezone' => 'Asia/Riyadh',
                'address' => 'South Training & Competency Facility — Jubail Industrial City',
                'lat' => 26.9421,
                'lng' => 49.6114,
                'scale' => 0.92,
            ],
            [
                'code' => 'DEMO-01',
                'name' => 'Riverside Tower — Demo',
                'timezone' => 'Asia/Dubai',
                'address' => 'Plot 12, Riverside Industrial Zone',
                'lat' => 25.2048,
                'lng' => 55.2708,
                'scale' => 0.75,
            ],
        ];
    }

    /**
     * @return list<array{code: string, name: string, zone_type: string, max_occupancy: int|null, lat: float, lng: float, authorized: bool}>
     */
    public static function rfidZones(): array
    {
        return [
            ['code' => 'gate-main', 'name' => 'Main gate — SCC', 'zone_type' => 'gate', 'max_occupancy' => null, 'lat' => 0.12, 'lng' => 0.08, 'authorized' => false],
            ['code' => 'work-front-a', 'name' => 'Active work front A', 'zone_type' => 'general', 'max_occupancy' => 25, 'lat' => 0.45, 'lng' => 0.52, 'authorized' => false],
            ['code' => 'work-front-b', 'name' => 'Active work front B', 'zone_type' => 'general', 'max_occupancy' => 18, 'lat' => 0.62, 'lng' => 0.38, 'authorized' => false],
            ['code' => 'restricted-pipe', 'name' => 'Restricted — live pipe rack', 'zone_type' => 'restricted', 'max_occupancy' => 6, 'lat' => 0.28, 'lng' => 0.71, 'authorized' => true],
            ['code' => 'height-scaffold', 'name' => 'Height work — scaffold bay', 'zone_type' => 'height_work', 'max_occupancy' => 8, 'lat' => 0.55, 'lng' => 0.65, 'authorized' => false],
            ['code' => 'muster-alpha', 'name' => 'Muster point Alpha', 'zone_type' => 'muster', 'max_occupancy' => 120, 'lat' => 0.18, 'lng' => 0.22, 'authorized' => false],
        ];
    }

    /**
     * @return list<array{code: string, name: string, mount_type: string, zone_code: string, edge_code: string|null}>
     */
    public static function rfidReaders(): array
    {
        return [
            ['code' => 'gate-main', 'name' => 'Gate reader — SCC LAN', 'mount_type' => 'gate', 'zone_code' => 'gate-main', 'edge_code' => null],
            ['code' => 'vehicle-01', 'name' => 'Vehicle 1 — primary surveillance', 'mount_type' => 'vehicle', 'zone_code' => 'work-front-a', 'edge_code' => 'edge-vehicle-01'],
            ['code' => 'vehicle-02', 'name' => 'Vehicle 2 — field unit', 'mount_type' => 'vehicle', 'zone_code' => 'work-front-b', 'edge_code' => 'edge-vehicle-02'],
            ['code' => 'vehicle-03', 'name' => 'Vehicle 3 — field unit', 'mount_type' => 'vehicle', 'zone_code' => 'work-front-a', 'edge_code' => 'edge-vehicle-03'],
            ['code' => 'pole-01', 'name' => 'Pole 1 — north yard', 'mount_type' => 'pole', 'zone_code' => 'work-front-a', 'edge_code' => 'edge-vehicle-01'],
            ['code' => 'pole-02', 'name' => 'Pole 2 — pipe rack', 'mount_type' => 'pole', 'zone_code' => 'restricted-pipe', 'edge_code' => 'edge-vehicle-02'],
            ['code' => 'pole-03', 'name' => 'Pole 3 — scaffold', 'mount_type' => 'pole', 'zone_code' => 'height-scaffold', 'edge_code' => 'edge-vehicle-03'],
            ['code' => 'pole-04', 'name' => 'Pole 4 — south approach', 'mount_type' => 'pole', 'zone_code' => 'work-front-b', 'edge_code' => 'edge-vehicle-02'],
        ];
    }

    /**
     * @return list<array{code: string, name: string, mount_type: string}>
     */
    public static function edgeDevices(): array
    {
        return [
            ['code' => 'edge-vehicle-01', 'name' => 'Jetson J4012 — Vehicle 1 (TandemVu)', 'mount_type' => 'vehicle'],
            ['code' => 'edge-vehicle-02', 'name' => 'Jetson J4012 — Vehicle 2', 'mount_type' => 'vehicle'],
            ['code' => 'edge-vehicle-03', 'name' => 'Jetson J4012 — Vehicle 3', 'mount_type' => 'vehicle'],
        ];
    }

    /**
     * @return list<array{code: string, name: string, vehicle_label: string, edge_code: string}>
     */
    public static function gasGateways(): array
    {
        return [
            ['code' => 'gas-gw-vehicle-01', 'name' => 'Gas gateway — Vehicle 1', 'vehicle_label' => 'Surveillance Truck 1', 'edge_code' => 'edge-vehicle-01'],
            ['code' => 'gas-gw-vehicle-02', 'name' => 'Gas gateway — Vehicle 2', 'vehicle_label' => 'Surveillance Truck 2', 'edge_code' => 'edge-vehicle-02'],
            ['code' => 'gas-gw-vehicle-03', 'name' => 'Gas gateway — Vehicle 3', 'vehicle_label' => 'Surveillance Truck 3', 'edge_code' => 'edge-vehicle-03'],
        ];
    }

    /**
     * @return list<array{code: string, name: string, device_type: string, edge_code: string}>
     */
    public static function sensorDevices(): array
    {
        return [
            [
                'code' => 'sensor-co2-vehicle-01',
                'name' => 'CO₂ NDIR — Vehicle 1',
                'device_type' => 'co2_ndir',
                'edge_code' => 'edge-vehicle-01',
            ],
            [
                'code' => 'sensor-weather-vehicle-01',
                'name' => 'RS485 weather station — Vehicle 1',
                'device_type' => 'weather_station',
                'edge_code' => 'edge-vehicle-01',
            ],
            [
                'code' => 'sensor-co2-vehicle-02',
                'name' => 'CO₂ NDIR — Vehicle 2',
                'device_type' => 'co2_ndir',
                'edge_code' => 'edge-vehicle-02',
            ],
        ];
    }

    /**
     * @return list<array{tag_epc: string, employee_number: string, full_name: string, contractor: string, role: string, nationality: string, portable_approved: bool, portable_devices: list<array<string, string|null>>, on_site_default: bool, zone_code: string, stationary: bool}>
     */
    public static function workers(): array
    {
        return [
            ['tag_epc' => 'E2801160600002010000A001', 'employee_number' => 'SA-10482', 'full_name' => 'Ahmed Al-Rashid', 'contractor' => 'NESMA & Partners', 'role' => 'Pipefitter', 'nationality' => 'Saudi', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'IPH-AR-10482', 'approved_at' => '2026-01-15']], 'on_site_default' => true, 'zone_code' => 'work-front-a', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A002', 'employee_number' => 'SA-10491', 'full_name' => 'Mohammed Al-Qahtani', 'contractor' => 'NESMA & Partners', 'role' => 'Welder', 'nationality' => 'Saudi', 'portable_approved' => true, 'portable_devices' => [['type' => 'tablet', 'serial' => 'TAB-MQ-10491', 'approved_at' => '2026-01-15']], 'on_site_default' => true, 'zone_code' => 'work-front-a', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A003', 'employee_number' => 'PK-8821', 'full_name' => 'Rajesh Kumar', 'contractor' => 'Tekfen Construction', 'role' => 'Scaffolder', 'nationality' => 'Pakistani', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'AND-RK-8821', 'approved_at' => '2026-02-01']], 'on_site_default' => true, 'zone_code' => 'height-scaffold', 'stationary' => true],
            ['tag_epc' => 'E2801160600002010000A004', 'employee_number' => 'IN-3390', 'full_name' => 'Vikram Singh', 'contractor' => 'Tekfen Construction', 'role' => 'Rigger', 'nationality' => 'Indian', 'portable_approved' => false, 'portable_devices' => [], 'on_site_default' => true, 'zone_code' => 'work-front-b', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A005', 'employee_number' => 'PH-2201', 'full_name' => 'Juan Dela Cruz', 'contractor' => 'CB&I / McDermott', 'role' => 'Electrician', 'nationality' => 'Filipino', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'IPH-JD-2201', 'approved_at' => '2026-01-20']], 'on_site_default' => true, 'zone_code' => 'work-front-b', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A006', 'employee_number' => 'SA-10510', 'full_name' => 'Khalid Al-Otaibi', 'contractor' => 'Al Rushaid Construction', 'role' => 'HSE Officer', 'nationality' => 'Saudi', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'IPH-KO-10510', 'approved_at' => '2026-01-10'], ['type' => 'radio', 'serial' => 'MOT-KO-10510', 'approved_at' => '2026-01-10']], 'on_site_default' => true, 'zone_code' => 'work-front-a', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A007', 'employee_number' => 'BD-7712', 'full_name' => 'Abdul Rahman', 'contractor' => 'CB&I / McDermott', 'role' => 'Instrument Tech', 'nationality' => 'Bangladeshi', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'AND-AR-7712', 'approved_at' => '2026-02-05']], 'on_site_default' => true, 'zone_code' => 'restricted-pipe', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A008', 'employee_number' => 'NP-4410', 'full_name' => 'Bikash Thapa', 'contractor' => 'Tekfen Construction', 'role' => 'Helper', 'nationality' => 'Nepali', 'portable_approved' => false, 'portable_devices' => [], 'on_site_default' => true, 'zone_code' => 'work-front-a', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A009', 'employee_number' => 'SA-10522', 'full_name' => 'Faisal Al-Dosari', 'contractor' => 'Al Rushaid Construction', 'role' => 'Foreman', 'nationality' => 'Saudi', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'IPH-FD-10522', 'approved_at' => '2026-01-12']], 'on_site_default' => true, 'zone_code' => 'work-front-a', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A010', 'employee_number' => 'EG-1188', 'full_name' => 'Hassan Ibrahim', 'contractor' => 'NESMA & Partners', 'role' => 'Crane Operator', 'nationality' => 'Egyptian', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'IPH-HI-1188', 'approved_at' => '2026-01-18']], 'on_site_default' => true, 'zone_code' => 'work-front-b', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A011', 'employee_number' => 'SA-10530', 'full_name' => 'Sultan Al-Harbi', 'contractor' => 'Saudi Aramco Projects', 'role' => 'Area Authority', 'nationality' => 'Saudi', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'IPH-SH-10530', 'approved_at' => '2026-01-08']], 'on_site_default' => false, 'zone_code' => 'gate-main', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A012', 'employee_number' => 'IN-3401', 'full_name' => 'Anil Sharma', 'contractor' => 'Tekfen Construction', 'role' => 'Welder', 'nationality' => 'Indian', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'AND-AS-3401', 'approved_at' => '2026-02-10']], 'on_site_default' => true, 'zone_code' => 'height-scaffold', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A013', 'employee_number' => 'PK-8835', 'full_name' => 'Imran Khan', 'contractor' => 'CB&I / McDermott', 'role' => 'Pipefitter', 'nationality' => 'Pakistani', 'portable_approved' => true, 'portable_devices' => [['type' => 'phone', 'serial' => 'AND-IK-8835', 'approved_at' => '2026-01-25']], 'on_site_default' => false, 'zone_code' => 'gate-main', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A014', 'employee_number' => 'SA-10544', 'full_name' => 'Nasser Al-Mutairi', 'contractor' => 'Al Rushaid Construction', 'role' => 'Safety Watch', 'nationality' => 'Saudi', 'portable_approved' => true, 'portable_devices' => [['type' => 'radio', 'serial' => 'MOT-NM-10544', 'approved_at' => '2026-01-14']], 'on_site_default' => true, 'zone_code' => 'work-front-a', 'stationary' => false],
            ['tag_epc' => 'E2801160600002010000A015', 'employee_number' => 'PH-2215', 'full_name' => 'Mark Reyes', 'contractor' => 'NESMA & Partners', 'role' => 'Painter', 'nationality' => 'Filipino', 'portable_approved' => false, 'portable_devices' => [], 'on_site_default' => true, 'zone_code' => 'work-front-b', 'stationary' => false],
        ];
    }

    /**
     * @return list<array{equipment_id: string, name: string, equipment_type: string, manufacturer: string, model: string, serial_number: string, location_note: string, status: string}>
     */
    public static function equipment(): array
    {
        return [
            ['equipment_id' => 'EQ-CRANE-014', 'name' => 'Liebherr LTM 1100-4.2', 'equipment_type' => 'crane', 'manufacturer' => 'Liebherr', 'model' => 'LTM 1100-4.2', 'serial_number' => 'LH-1100-2024-014', 'location_note' => 'Work front A — laydown', 'status' => 'active'],
            ['equipment_id' => 'EQ-GEN-007', 'name' => 'Caterpillar C18 Generator 500kVA', 'equipment_type' => 'generator', 'manufacturer' => 'Caterpillar', 'model' => 'C18', 'serial_number' => 'CAT-C18-500-007', 'location_note' => 'South yard', 'status' => 'active'],
            ['equipment_id' => 'EQ-COMP-003', 'name' => 'Atlas Copco XAS 185 Compressor', 'equipment_type' => 'compressor', 'manufacturer' => 'Atlas Copco', 'model' => 'XAS 185', 'serial_number' => 'AC-XAS185-003', 'location_note' => 'Pipe rack area', 'status' => 'active'],
            ['equipment_id' => 'EQ-VEH-FMC125-01', 'name' => 'Teltonika FMC125 — Vehicle tracker 1', 'equipment_type' => 'vehicle', 'manufacturer' => 'Teltonika', 'model' => 'FMC125', 'serial_number' => 'TEL-FMC125-01', 'location_note' => 'Surveillance Truck 1', 'status' => 'active'],
            ['equipment_id' => 'EQ-PLANT-EXC-02', 'name' => 'CAT 336 Excavator', 'equipment_type' => 'plant', 'manufacturer' => 'Caterpillar', 'model' => '336', 'serial_number' => 'CAT-336-2023-02', 'location_note' => 'Work front B', 'status' => 'out_of_service'],
        ];
    }

    /**
     * @return list<array{lsr_category: string, detection_mode: string, description: string, actions_taken: string|null, days_ago: int}>
     */
    public static function lsrViolations(): array
    {
        return [
            ['lsr_category' => 'LSR-RZ-001', 'detection_mode' => 'automated', 'description' => 'Unauthorized entry — Restricted live pipe rack', 'actions_taken' => 'Worker removed from zone; permit verified with area authority.', 'days_ago' => 2],
            ['lsr_category' => 'LSR-OC-001', 'detection_mode' => 'automated', 'description' => 'Zone occupancy exceeded — Active work front A (26/25)', 'actions_taken' => 'Work front paused; headcount reduced before restart.', 'days_ago' => 4],
            ['lsr_category' => 'LSR-WD-001', 'detection_mode' => 'automated', 'description' => 'Stationary tag alert — Rajesh Kumar, height scaffold zone', 'actions_taken' => 'SCC operator verified via camera; worker resting on platform — no injury.', 'days_ago' => 1],
            ['lsr_category' => 'LSR-GAS-001', 'detection_mode' => 'automated', 'description' => 'LEL 22% on Vehicle 2 gas gateway — immediate alarm', 'actions_taken' => 'Area evacuated; ventilation confirmed; gas test repeated before re-entry.', 'days_ago' => 3],
            ['lsr_category' => 'LSR-PERMIT-001', 'detection_mode' => 'manual', 'description' => 'Hot work observed without visible permit at pipe rack', 'actions_taken' => 'Work stopped; permit issued before resumption.', 'days_ago' => 5],
            ['lsr_category' => 'LSR-HOTWORK-001', 'detection_mode' => 'manual', 'description' => 'Welding without dedicated fire watch on scaffold bay', 'actions_taken' => 'Fire watch assigned; SIMOPS reviewed with supervisor.', 'days_ago' => 6],
            ['lsr_category' => 'LSR-SIMOPS-001', 'detection_mode' => 'manual', 'description' => 'Crane lift overlapping with scaffold work — SIMOPS conflict', 'actions_taken' => null, 'days_ago' => 0],
        ];
    }

    /**
     * @return list<array{incident_number: string, status: string, severity: string|null, incident_type: string, days_ago: int, classified: bool}>
     */
    public static function hseIncidents(): array
    {
        return [
            ['incident_number' => 'INC-2026-00001', 'status' => 'pending_classification', 'severity' => null, 'incident_type' => 'fall_correlated', 'days_ago' => 1, 'classified' => false, 'correlated' => true],
            ['incident_number' => 'INC-2026-00002', 'status' => 'classified', 'severity' => 'medium', 'incident_type' => 'stationary_tag', 'days_ago' => 3, 'classified' => true, 'correlated' => false],
            ['incident_number' => 'INC-2026-00003', 'status' => 'classified', 'severity' => 'low', 'incident_type' => 'near_miss', 'days_ago' => 8, 'classified' => true, 'correlated' => false],
        ];
    }

    public static function unknownTagEpc(): string
    {
        return 'E2801160600002010000FFFF';
    }

    /**
     * @return list<array{vehicle_description: string, violation_type: string, description: string, actions_taken: string, days_ago: int}>
     */
    public static function vehicleViolations(): array
    {
        return [
            [
                'vehicle_description' => 'White Toyota Hilux — plate ABC 4821',
                'violation_type' => 'speeding',
                'description' => 'Vehicle exceeded 20 km/h limit in laydown yard (camera observation).',
                'actions_taken' => 'Driver briefed; contractor notified per UDPM §6.5 vii.',
                'days_ago' => 4,
            ],
            [
                'vehicle_description' => 'EQ-VEH-FMC125-01 Surveillance Truck 1',
                'violation_type' => 'unauthorized_zone',
                'description' => 'Vehicle entered restricted pipe rack without escort.',
                'actions_taken' => 'Access revoked for 24h; escort policy reinforced.',
                'days_ago' => 7,
            ],
        ];
    }
}
