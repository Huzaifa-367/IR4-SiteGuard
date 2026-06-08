<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\UpdateGasThresholdsRequest;
use App\Models\GasGateway;
use App\Models\GasReading;
use App\Models\SensorAlarm;
use App\Models\SensorDevice;
use App\Models\SensorReading;
use App\Support\IotAnalytics;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class GasMonitoringController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:gas.view|environmental.view', only: ['overview', 'readings']),
            new Middleware('permission:gas_thresholds.manage', only: ['updateThresholds']),
        ];
    }

    public function overview(Request $request, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);
        $thresholds = $site->settings['gas_thresholds']
            ?? config('siteguard.gas_thresholds');

        return Inertia::render('iot/gas/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'thresholds' => $thresholds,
            'analytics' => $iotAnalytics->gasPageAnalytics($site->id),
            'permissions' => [
                'canManageThresholds' => $request->user()?->can('gas_thresholds.manage') ?? false,
            ],
        ]);
    }

    public function readings(Request $request): Response
    {
        $site = $this->selectedSite($request);

        $gateways = GasGateway::query()
            ->where('site_id', $site->id)
            ->orderBy('code')
            ->get()
            ->map(function (GasGateway $gateway) use ($site): array {
                $latest = GasReading::query()
                    ->where('site_id', $site->id)
                    ->where('gas_gateway_id', $gateway->id)
                    ->orderByDesc('read_at')
                    ->first();

                return [
                    'id' => $gateway->id,
                    'name' => $gateway->name,
                    'code' => $gateway->code,
                    'vehicle_label' => $gateway->vehicle_label,
                    'health_status' => $gateway->health_status,
                    'latest' => $latest ? [
                        'lel_pct' => $latest->lel_pct,
                        'o2_pct' => $latest->o2_pct,
                        'h2s_ppm' => $latest->h2s_ppm,
                        'co_ppm' => $latest->co_ppm,
                        'alarm_state' => $latest->alarm_state,
                        'read_at' => $latest->read_at->toIso8601String(),
                    ] : null,
                ];
            });

        $sensors = SensorDevice::query()
            ->where('site_id', $site->id)
            ->orderBy('code')
            ->get()
            ->map(function (SensorDevice $device) use ($site): array {
                $latestReadings = SensorReading::query()
                    ->where('site_id', $site->id)
                    ->where('sensor_device_id', $device->id)
                    ->whereIn('parameter', ['co2_ppm', 'temp_c', 'humidity_pct', 'wind_speed_mps'])
                    ->orderByDesc('read_at')
                    ->get()
                    ->unique('parameter')
                    ->keyBy('parameter');

                return [
                    'id' => $device->id,
                    'name' => $device->name,
                    'code' => $device->code,
                    'device_type' => $device->device_type,
                    'health_status' => $device->health_status,
                    'modbus_config' => $device->modbus_config,
                    'latest_co2_ppm' => $latestReadings->get('co2_ppm')?->value,
                    'latest_temp_c' => $latestReadings->get('temp_c')?->value,
                    'latest_humidity_pct' => $latestReadings->get('humidity_pct')?->value,
                    'latest_wind_mps' => $latestReadings->get('wind_speed_mps')?->value,
                    'read_at' => $latestReadings->first()?->read_at?->toIso8601String(),
                ];
            });

        $alarms = SensorAlarm::query()
            ->where('site_id', $site->id)
            ->whereNull('cleared_at')
            ->orderByDesc('alarm_at')
            ->limit(20)
            ->get()
            ->map(fn (SensorAlarm $alarm): array => [
                'id' => $alarm->id,
                'source_type' => $alarm->source_type,
                'parameter' => $alarm->parameter,
                'value' => $alarm->value,
                'threshold' => $alarm->threshold,
                'severity' => $alarm->severity,
                'alarm_at' => $alarm->alarm_at->toIso8601String(),
                'alert_id' => $alarm->alert_id,
            ]);

        $thresholds = $site->settings['gas_thresholds']
            ?? config('siteguard.gas_thresholds');

        return Inertia::render('iot/gas/readings', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'gateways' => $gateways,
            'sensors' => $sensors,
            'alarms' => $alarms,
            'thresholds' => $thresholds,
        ]);
    }

    public function updateThresholds(UpdateGasThresholdsRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $settings = $site->settings ?? [];
        $settings['gas_thresholds'] = $request->validated();
        $site->update(['settings' => $settings]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Gas alarm thresholds updated.'),
        ]);

        return to_route('iot.gas.overview');
    }
}
