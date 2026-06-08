<?php

use App\Http\Controllers\AiSessionController;
use App\Http\Controllers\AlertController;
use App\Http\Controllers\CameraController;
use App\Http\Controllers\CameraZoneController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeploymentApprovalController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\FieldDeviceController;
use App\Http\Controllers\GasMonitoringController;
use App\Http\Controllers\HseIncidentController;
use App\Http\Controllers\InvestigationController;
use App\Http\Controllers\LsrViolationController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\RfidOperationsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SiteContextController;
use App\Http\Controllers\SiteController;
use App\Http\Controllers\SiteModuleController;
use App\Http\Controllers\SiteRuleController;
use App\Http\Controllers\UdpmReportController;
use App\Http\Controllers\UserManagementController;
use App\Models\Site;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('site-context', [SiteContextController::class, 'update'])
        ->name('site-context.update');

    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::get('sites', [SiteController::class, 'index'])->name('sites.index');
    Route::get('sites/create', [SiteController::class, 'create'])->name('sites.create');
    Route::post('sites', [SiteController::class, 'store'])->name('sites.store');
    Route::get('sites/{site}', [SiteController::class, 'show'])
        ->middleware('site.access')
        ->name('sites.show');
    Route::get('sites/{site}/edit', [SiteController::class, 'edit'])
        ->middleware('site.access')
        ->name('sites.edit');
    Route::patch('sites/{site}', [SiteController::class, 'update'])
        ->middleware('site.access')
        ->name('sites.update');

    Route::middleware('selected.site')->group(function () {
        Route::get('modules', [SiteModuleController::class, 'index'])->name('modules.index');
        Route::patch('modules/{module}', [SiteModuleController::class, 'update'])->name('modules.update');

        Route::get('rules', [SiteRuleController::class, 'index'])->name('rules.index');
        Route::post('rules', [SiteRuleController::class, 'store'])->name('rules.store');
        Route::patch('rules/{rule}', [SiteRuleController::class, 'update'])->name('rules.update');
        Route::delete('rules/{rule}', [SiteRuleController::class, 'destroy'])->name('rules.destroy');

        Route::get('investigations', [InvestigationController::class, 'index'])->name('investigations.index');
        Route::post('investigations', [InvestigationController::class, 'store'])->name('investigations.store');
        Route::get('investigations/{investigation}', [InvestigationController::class, 'show'])->name('investigations.show');
        Route::post('investigations/{investigation}/close', [InvestigationController::class, 'close'])
            ->name('investigations.close');

        Route::get('ai', [AiSessionController::class, 'index'])->name('ai.index');
        Route::post('ai/sessions', [AiSessionController::class, 'store'])->name('ai.sessions.store');
        Route::get('ai/sessions/{session}', [AiSessionController::class, 'show'])->name('ai.sessions.show');
        Route::post('ai/sessions/{session}/messages/stream', [AiSessionController::class, 'messageStream'])
            ->name('ai.messages.stream');

        Route::prefix('iot')->name('iot.')->group(function () {
            Route::get('field-devices', [FieldDeviceController::class, 'overview'])->name('field-devices.overview');
            Route::get('field-devices/edge', [FieldDeviceController::class, 'edgeDevices'])->name('field-devices.edge.index');
            Route::get('field-devices/rfid-readers', [FieldDeviceController::class, 'rfidReaders'])->name('field-devices.rfid-readers.index');
            Route::get('field-devices/gas-gateways', [FieldDeviceController::class, 'gasGateways'])->name('field-devices.gas-gateways.index');
            Route::get('field-devices/sensors', [FieldDeviceController::class, 'sensorDevices'])->name('field-devices.sensors.index');
            Route::get('field-devices/{type}/{id}', [FieldDeviceController::class, 'show'])->name('field-devices.show');
            Route::post('field-devices/edge', [FieldDeviceController::class, 'storeEdge'])->name('field-devices.edge.store');
            Route::post('field-devices/rfid-readers', [FieldDeviceController::class, 'storeRfidReader'])->name('field-devices.rfid-readers.store');
            Route::post('field-devices/gas-gateways', [FieldDeviceController::class, 'storeGasGateway'])->name('field-devices.gas-gateways.store');
            Route::post('field-devices/sensor-devices', [FieldDeviceController::class, 'storeSensorDevice'])->name('field-devices.sensor-devices.store');
            Route::post('field-devices/{type}/{id}/ingest-token', [FieldDeviceController::class, 'issueToken'])
                ->name('field-devices.ingest-token.store');

            Route::get('rfid', [RfidOperationsController::class, 'overview'])->name('rfid.overview');
            Route::get('rfid/zones', [RfidOperationsController::class, 'zones'])->name('rfid.zones.index');
            Route::get('rfid/zones/{zone}', [RfidOperationsController::class, 'showZone'])->name('rfid.zones.show');
            Route::get('rfid/workers', [RfidOperationsController::class, 'workers'])->name('rfid.workers.index');
            Route::get('rfid/workers/{worker}', [RfidOperationsController::class, 'showWorker'])->name('rfid.workers.show');
            Route::get('rfid/portable-devices', [RfidOperationsController::class, 'portableDevices'])->name('rfid.portable-devices.index');
            Route::get('rfid/personnel', [RfidOperationsController::class, 'personnel'])->name('rfid.personnel.index');
            Route::get('rfid/gate-log', [RfidOperationsController::class, 'gateLog'])->name('rfid.gate-log.index');
            Route::get('rfid/gate-log/{log}', [RfidOperationsController::class, 'showGateLog'])->name('rfid.gate-log.show');
            Route::get('rfid/evacuations', [RfidOperationsController::class, 'evacuations'])->name('rfid.evacuations.index');
            Route::post('rfid/workers', [RfidOperationsController::class, 'storeWorker'])->name('rfid.workers.store');
            Route::patch('rfid/workers/{worker}/portable-devices', [RfidOperationsController::class, 'updatePortableDevices'])
                ->name('rfid.workers.portable-devices.update');
            Route::post('rfid/zones', [RfidOperationsController::class, 'storeZone'])->name('rfid.zones.store');
            Route::post('rfid/evacuation', [RfidOperationsController::class, 'generateEvacuation'])->name('rfid.evacuation.generate');
            Route::get('rfid/evacuation/{report}', [RfidOperationsController::class, 'showEvacuation'])->name('rfid.evacuation.show');
            Route::patch('rfid/evacuation/{report}/muster', [RfidOperationsController::class, 'updateEvacuationMuster'])
                ->name('rfid.evacuation.muster.update');
            Route::get('rfid/evacuation/{report}/export', [RfidOperationsController::class, 'exportEvacuation'])
                ->name('rfid.evacuation.export');

            Route::get('deployment-approvals', [DeploymentApprovalController::class, 'index'])->name('deployment-approvals.index');
            Route::get('deployment-approvals/{approval}', [DeploymentApprovalController::class, 'show'])->name('deployment-approvals.show');
            Route::post('deployment-approvals', [DeploymentApprovalController::class, 'store'])->name('deployment-approvals.store');
            Route::post('deployment-approvals/{approval}/approve', [DeploymentApprovalController::class, 'approve'])->name('deployment-approvals.approve');

            Route::get('gas', [GasMonitoringController::class, 'overview'])->name('gas.overview');
            Route::get('gas/readings', [GasMonitoringController::class, 'readings'])->name('gas.readings.index');
            Route::patch('gas/thresholds', [GasMonitoringController::class, 'updateThresholds'])->name('gas.thresholds.update');

            Route::get('equipment', [EquipmentController::class, 'overview'])->name('equipment.overview');
            Route::get('equipment/assets', [EquipmentController::class, 'assets'])->name('equipment.assets.index');
            Route::get('equipment/{asset}', [EquipmentController::class, 'show'])->name('equipment.show');
            Route::post('equipment', [EquipmentController::class, 'store'])->name('equipment.store');
            Route::post('equipment/{asset}/inspections', [EquipmentController::class, 'storeInspection'])->name('equipment.inspections.store');
            Route::post('equipment/{asset}/maintenance', [EquipmentController::class, 'storeMaintenance'])->name('equipment.maintenance.store');
            Route::post('equipment/{asset}/documents', [EquipmentController::class, 'storeDocument'])->name('equipment.documents.store');
            Route::get('equipment/{asset}/print-label', [EquipmentController::class, 'printLabel'])->name('equipment.print-label');

            Route::get('udpm', [UdpmReportController::class, 'index'])->name('udpm.index');
            Route::post('udpm', [UdpmReportController::class, 'generate'])->name('udpm.generate');
            Route::get('udpm/{report}', [UdpmReportController::class, 'show'])->name('udpm.show');
            Route::post('udpm/{report}/approve', [UdpmReportController::class, 'approve'])->name('udpm.approve');
            Route::get('udpm/{report}/export', [UdpmReportController::class, 'export'])->name('udpm.export');
            Route::get('udpm/{report}/export-html', [UdpmReportController::class, 'exportHtml'])->name('udpm.export-html');

            Route::get('hse-incidents', [HseIncidentController::class, 'overview'])->name('hse-incidents.overview');
            Route::get('hse-incidents/register', [HseIncidentController::class, 'register'])->name('hse-incidents.register.index');
            Route::get('hse-incidents/{incident}', [HseIncidentController::class, 'show'])->name('hse-incidents.show');
            Route::patch('hse-incidents/{incident}/classify', [HseIncidentController::class, 'classify'])
                ->name('hse-incidents.classify');

            Route::get('lsr', [LsrViolationController::class, 'overview'])->name('lsr.overview');
            Route::get('lsr/violations', [LsrViolationController::class, 'violations'])->name('lsr.violations.index');
            Route::get('lsr/vehicle-violations', [LsrViolationController::class, 'vehicleViolations'])->name('lsr.vehicle-violations.index');
            Route::get('lsr/vehicle-violations/{vehicleViolation}', [LsrViolationController::class, 'showVehicleViolation'])
                ->name('lsr.vehicle-violations.show');
            Route::get('lsr/{violation}', [LsrViolationController::class, 'show'])->name('lsr.show');
            Route::post('lsr', [LsrViolationController::class, 'store'])->name('lsr.store');
            Route::patch('lsr/{violation}/actions', [LsrViolationController::class, 'updateActions'])
                ->name('lsr.actions.update');
            Route::post('lsr/vehicle-violations', [LsrViolationController::class, 'storeVehicle'])
                ->name('lsr.vehicle-violations.store');
        });
    });

    Route::get('sites/{site}/modules', fn (Site $site) => redirect()->route('modules.index'))
        ->middleware('site.access');
    Route::get('sites/{site}/rules', fn (Site $site) => redirect()->route('rules.index'))
        ->middleware('site.access');
    Route::get('sites/{site}/investigations', fn (Site $site) => redirect()->route('investigations.index'))
        ->middleware('site.access');
    Route::get('sites/{site}/investigations/{investigation}', fn (Site $site, $investigation) => redirect()->route('investigations.show', $investigation))
        ->middleware('site.access');
    Route::get('sites/{site}/ai', fn (Site $site) => redirect()->route('ai.index'))
        ->middleware('site.access');

    Route::post('sites/{site}/cameras', [CameraController::class, 'store'])
        ->middleware('site.access')
        ->name('sites.cameras.store');

    Route::get('cameras/{camera}/zones', [CameraZoneController::class, 'index'])
        ->name('cameras.zones.index');
    Route::post('cameras/{camera}/zones', [CameraZoneController::class, 'store'])
        ->name('cameras.zones.store');
    Route::delete('cameras/{camera}/zones/{zone}', [CameraZoneController::class, 'destroy'])
        ->name('cameras.zones.destroy');

    Route::patch('cameras/{camera}', [CameraController::class, 'update'])->name('cameras.update');
    Route::delete('cameras/{camera}', [CameraController::class, 'destroy'])->name('cameras.destroy');
    Route::post('cameras/{camera}/ingest-token', [CameraController::class, 'issueIngestToken'])
        ->name('cameras.ingest-token.store');
    Route::delete('cameras/{camera}/ingest-token', [CameraController::class, 'revokeIngestToken'])
        ->name('cameras.ingest-token.destroy');

    Route::get('alerts', [AlertController::class, 'index'])->name('alerts.index');
    Route::get('alerts/{alert}', [AlertController::class, 'show'])->name('alerts.show');
    Route::post('alerts/{alert}/acknowledge', [AlertController::class, 'acknowledge'])
        ->name('alerts.acknowledge');
    Route::post('alerts/{alert}/dismiss', [AlertController::class, 'dismiss'])
        ->name('alerts.dismiss');
    Route::post('alerts/{alert}/investigations', [AlertController::class, 'createInvestigation'])
        ->name('alerts.investigations.store');
    Route::post('alerts/{alert}/link-investigation', [AlertController::class, 'linkInvestigation'])
        ->name('alerts.investigations.link');
    Route::post('alerts/{alert}/hse-incident', [AlertController::class, 'createHseIncident'])
        ->name('alerts.hse-incident.store');

    Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
    Route::post('users', [UserManagementController::class, 'store'])->name('users.store');
    Route::patch('users/{user}', [UserManagementController::class, 'update'])->name('users.update');

    Route::get('settings/platform', [SettingsController::class, 'index'])->name('settings.platform.index');
    Route::patch('settings/platform', [SettingsController::class, 'update'])->name('settings.platform.update');

    Route::get('reports', [ReportsController::class, 'index'])->name('reports.index');
    Route::get('reports/alerts/export', [ReportsController::class, 'exportAlerts'])
        ->name('reports.alerts.export');
});
