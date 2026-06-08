<?php

return [
    'alert_statuses' => [
        'open' => 'Open',
        'acknowledged' => 'Acknowledged',
        'dismissed' => 'Dismissed',
        'closed' => 'Closed',
    ],

    'rfid_zone_types' => [
        'general' => 'General',
        'restricted' => 'Restricted',
        'height_work' => 'Height work',
        'muster' => 'Muster',
        'gate' => 'Gate',
    ],

    'mount_types' => [
        'gate' => 'Gate',
        'vehicle' => 'Vehicle',
        'pole' => 'Pole',
    ],

    'sensor_device_types' => [
        'co2_ndir' => 'CO₂ NDIR',
        'weather_station' => 'Weather station',
        'air_quality' => 'Air quality',
        'custom_modbus' => 'Custom Modbus',
    ],

    'portable_device_types' => [
        'phone' => 'Phone',
        'tablet' => 'Tablet',
        'camera' => 'Portable camera',
    ],

    'equipment_types' => [
        'vehicle' => 'Vehicle',
        'crane' => 'Crane',
        'generator' => 'Generator',
        'compressor' => 'Compressor',
        'plant' => 'Plant',
        'other' => 'Other',
    ],

    'inspection_outcomes' => [
        'pass' => 'Pass',
        'fail' => 'Fail',
        'conditional' => 'Conditional',
    ],

    'maintenance_types' => [
        'preventive' => 'Preventive',
        'corrective' => 'Corrective',
        'inspection' => 'Inspection',
    ],

    'document_types' => [
        'manual' => 'Manual',
        'certificate' => 'Certificate',
        'inspection_report' => 'Inspection report',
        'other' => 'Other',
    ],

    'muster_statuses' => [
        'unknown' => 'Unknown',
        'accounted' => 'Accounted',
        'unaccounted' => 'Unaccounted',
    ],

    'hse_incident_types' => [
        'fall_detected' => 'Fall detected',
        'fall_correlated' => 'Fall (correlated)',
        'stationary_tag' => 'Stationary tag',
        'safety_alert' => 'Safety alert',
        'gas' => 'Gas exposure',
        'ppe' => 'PPE violation',
        'vehicle' => 'Vehicle incident',
        'other' => 'Other',
    ],

    'hse_severities' => [
        'near_miss' => 'Near miss',
        'minor' => 'Minor',
        'medium' => 'Medium',
        'major' => 'Major',
        'critical' => 'Critical',
        'recordable' => 'Recordable',
    ],

    'hse_root_cause_categories' => [
        'human_error' => 'Human error',
        'equipment_failure' => 'Equipment failure',
        'procedure_gap' => 'Procedure gap',
        'environmental' => 'Environmental',
        'training' => 'Training',
        'supervision' => 'Supervision',
        'other' => 'Other',
    ],

    'rule_code_to_incident_type' => [
        'HSE-V-001' => 'fall_detected',
        'HSE-V-002' => 'fall_detected',
        'RFID-003' => 'stationary_tag',
        'GAS-001' => 'gas',
        'PPE-001' => 'ppe',
    ],

    'vehicle_violation_types' => [
        'speeding' => 'Speeding',
        'unauthorized_zone' => 'Unauthorized zone',
        'proximity' => 'Proximity breach',
        'parking' => 'Parking violation',
        'other' => 'Other',
    ],

    'lsr_categories' => [
        'LSR-PPE-001' => ['label' => 'Missing PPE (helmet, vest, harness, mask)', 'mode' => 'automated', 'method' => 'Camera AI'],
        'LSR-RZ-001' => ['label' => 'Red zone / restricted area intrusion', 'mode' => 'automated', 'method' => 'RFID geofencing'],
        'LSR-OC-001' => ['label' => 'Zone occupancy limit exceeded', 'mode' => 'automated', 'method' => 'RFID headcount'],
        'LSR-WD-001' => ['label' => 'Worker down / stationary tag', 'mode' => 'automated', 'method' => 'Camera + RFID'],
        'LSR-GAS-001' => ['label' => 'Gas threshold exceeded', 'mode' => 'automated', 'method' => 'Gas detector'],
        'LSR-HGT-001' => ['label' => 'Working at height without harness', 'mode' => 'automated', 'method' => 'Camera AI'],
        'LSR-PERMIT-001' => ['label' => 'Working without a permit', 'mode' => 'manual'],
        'LSR-HOTWORK-001' => ['label' => 'Hot work without fire watch', 'mode' => 'manual'],
        'LSR-SIMOPS-001' => ['label' => 'SIMOPS violation', 'mode' => 'manual'],
    ],

    'commissioning_gate_states' => [
        'pending' => 'Pending',
        'approved' => 'Approved',
    ],

    'commissioning_approval_type' => 'cctv_gi',
];
