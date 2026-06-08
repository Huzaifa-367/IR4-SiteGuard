<?php

namespace Database\Seeders\Support;

use App\Models\EdgeDevice;
use App\Models\GasGateway;
use App\Models\RfidReader;
use App\Models\SensorDevice;
use App\Models\Site;
use Illuminate\Support\Facades\DB;

class IotSiteDataCleaner
{
    public function clear(Site $site): void
    {
        $siteId = $site->id;

        $iotAlertIds = DB::table('alerts')
            ->where('site_id', $siteId)
            ->whereNull('camera_id')
            ->pluck('id');

        DB::table('sensor_alarms')->where('site_id', $siteId)->delete();

        if ($iotAlertIds->isNotEmpty()) {
            DB::table('alerts')->whereIn('id', $iotAlertIds)->delete();
        }

        $assetIds = DB::table('equipment_assets')->where('site_id', $siteId)->pluck('id');

        if ($assetIds->isNotEmpty()) {
            DB::table('equipment_qr_scans')->whereIn('equipment_asset_id', $assetIds)->delete();
            DB::table('equipment_documents')->whereIn('equipment_asset_id', $assetIds)->delete();
            DB::table('equipment_inspections')->whereIn('equipment_asset_id', $assetIds)->delete();
            DB::table('equipment_maintenance_records')->whereIn('equipment_asset_id', $assetIds)->delete();
        }

        DB::table('equipment_assets')->where('site_id', $siteId)->delete();
        DB::table('udpm_weekly_reports')->where('site_id', $siteId)->delete();
        DB::table('vehicle_violation_logs')->where('site_id', $siteId)->delete();
        DB::table('lsr_violation_logs')->where('site_id', $siteId)->delete();
        DB::table('hse_incidents')->where('site_id', $siteId)->delete();
        DB::table('evacuation_reports')->where('site_id', $siteId)->delete();
        DB::table('sensor_readings')->where('site_id', $siteId)->delete();
        DB::table('gas_readings')->where('site_id', $siteId)->delete();
        DB::table('gate_entry_exit_log')->where('site_id', $siteId)->delete();
        DB::table('rfid_read_events')->where('site_id', $siteId)->delete();
        DB::table('rfid_tag_last_seen')->where('site_id', $siteId)->delete();
        DB::table('site_headcount_snapshots')->where('site_id', $siteId)->delete();
        DB::table('worker_records')->where('site_id', $siteId)->delete();

        $morphTypes = [
            (new EdgeDevice)->getMorphClass(),
            (new RfidReader)->getMorphClass(),
            (new GasGateway)->getMorphClass(),
            (new SensorDevice)->getMorphClass(),
        ];

        $deviceIds = DB::table('edge_devices')->where('site_id', $siteId)->pluck('id')
            ->merge(DB::table('rfid_readers')->where('site_id', $siteId)->pluck('id'))
            ->merge(DB::table('gas_gateways')->where('site_id', $siteId)->pluck('id'))
            ->merge(DB::table('sensor_devices')->where('site_id', $siteId)->pluck('id'));

        if ($deviceIds->isNotEmpty()) {
            DB::table('ingest_api_tokens')
                ->whereIn('tokenable_id', $deviceIds)
                ->whereIn('tokenable_type', $morphTypes)
                ->delete();
        }

        DB::table('gas_gateways')->where('site_id', $siteId)->delete();
        DB::table('sensor_devices')->where('site_id', $siteId)->delete();
        DB::table('rfid_readers')->where('site_id', $siteId)->delete();
        DB::table('rfid_zones')->where('site_id', $siteId)->delete();
        DB::table('edge_devices')->where('site_id', $siteId)->delete();
    }
}
