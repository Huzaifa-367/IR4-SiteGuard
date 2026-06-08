<?php

namespace App\Services\Sensor;

use App\Models\Alert;
use App\Models\DetectionModule;
use App\Models\GasGateway;
use App\Models\SensorAlarm;
use App\Models\SensorDevice;
use App\Support\LsrAutoLog;
use App\Support\SiteRuleResolver;
use Carbon\CarbonInterface;

class SensorThresholdService
{
    /**
     * @param  array<string, float|int>  $readings
     */
    public function evaluateGasReading(GasGateway $gateway, array $readings, CarbonInterface|string $readAt): void
    {
        $defaults = config('siteguard.gas_thresholds');
        $thresholds = $gateway->site->settings['gas_thresholds'] ?? $defaults;

        $checks = [
            'lel_pct' => ['value' => (float) $readings['lel_pct'], 'high' => (float) $thresholds['lel_pct']['high'], 'severity' => 'critical'],
            'h2s_ppm' => ['value' => (float) $readings['h2s_ppm'], 'high' => (float) $thresholds['h2s_ppm']['high'], 'severity' => 'critical'],
            'co_ppm' => ['value' => (float) $readings['co_ppm'], 'high' => (float) $thresholds['co_ppm']['high'], 'severity' => 'critical'],
        ];

        $o2 = (float) $readings['o2_pct'];
        $o2Low = (float) $thresholds['o2_pct']['low'];
        $o2High = (float) $thresholds['o2_pct']['high'];

        if ($o2 < $o2Low || $o2 > $o2High) {
            $this->raiseAlarm($gateway, GasGateway::class, $gateway->id, 'o2_pct', $o2, $o2 < $o2Low ? $o2Low : $o2High, 'critical', $readAt);
        }

        foreach ($checks as $parameter => $check) {
            if ($check['value'] >= $check['high']) {
                $this->raiseAlarm($gateway, GasGateway::class, $gateway->id, $parameter, $check['value'], $check['high'], $check['severity'], $readAt);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reading
     */
    public function evaluateSensorReading(SensorDevice $device, array $reading, CarbonInterface|string $readAt): void
    {
        $deviceThresholds = $device->settings['thresholds'] ?? [];
        $parameter = (string) $reading['parameter'];
        $value = (float) $reading['value'];

        if ($parameter === 'co2_ppm') {
            $global = config('siteguard.gas_thresholds.co2_ppm');
            $high = (float) ($deviceThresholds['co2_ppm']['high'] ?? $global['high']);

            if ($value >= $high) {
                $this->raiseAlarm($device, SensorDevice::class, $device->id, $parameter, $value, $high, 'high', $readAt);
            }

            return;
        }

        if (! isset($deviceThresholds[$parameter]['high'])) {
            return;
        }

        $high = (float) $deviceThresholds[$parameter]['high'];

        if ($value >= $high) {
            $this->raiseAlarm($device, SensorDevice::class, $device->id, $parameter, $value, $high, 'high', $readAt);
        }
    }

    private function raiseAlarm(
        GasGateway|SensorDevice $source,
        string $sourceType,
        int $sourceId,
        string $parameter,
        float $value,
        float $threshold,
        string $severity,
        CarbonInterface|string $readAt,
    ): void {
        $siteId = $source->site_id;

        $open = SensorAlarm::query()
            ->where('site_id', $siteId)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->where('parameter', $parameter)
            ->whereNull('cleared_at')
            ->exists();

        if ($open) {
            return;
        }

        $alarm = SensorAlarm::query()->create([
            'site_id' => $siteId,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'parameter' => $parameter,
            'value' => $value,
            'threshold' => $threshold,
            'severity' => $severity,
            'alarm_at' => $readAt,
        ]);

        $alert = $this->createAlertForAlarm($source, $parameter, $value, $threshold, $severity);

        if ($alert !== null) {
            $alarm->update(['alert_id' => $alert->id]);
        }
    }

    private function createAlertForAlarm(
        GasGateway|SensorDevice $source,
        string $parameter,
        float $value,
        float $threshold,
        string $severity,
    ): ?Alert {
        $ruleMatch = SiteRuleResolver::gasRuleMatchForParameter($parameter);

        if ($ruleMatch === null) {
            return null;
        }

        $moduleKey = $source instanceof GasGateway ? 'gas_monitoring' : 'environmental';
        $module = DetectionModule::query()->where('key', $moduleKey)->first();

        if ($module === null) {
            return null;
        }

        $rule = SiteRuleResolver::activeByMatch($source->site_id, $ruleMatch);

        if ($rule === null) {
            return null;
        }

        $sourceLabel = $source instanceof GasGateway
            ? $source->name
            : $source->name;

        $title = sprintf('%s — %s (%.2f / %.2f)', $rule->name, $sourceLabel, $value, $threshold);

        if (Alert::query()->where('rule_id', $rule->id)->where('status', 'open')->where('title', $title)->exists()) {
            return null;
        }

        $alert = Alert::query()->create([
            'site_id' => $source->site_id,
            'camera_id' => null,
            'detection_module_id' => $module->id,
            'rule_id' => $rule->id,
            'severity' => $rule->severity ?? $severity,
            'status' => 'open',
            'title' => $title,
            'first_detection_event_id' => null,
            'occurrence_count' => 1,
            'opened_at' => now(),
            'metadata' => [
                'source_type' => $source::class,
                'source_id' => $source->id,
                'parameter' => $parameter,
                'value' => $value,
                'threshold' => $threshold,
            ],
        ]);

        LsrAutoLog::fromAlert($alert);

        return $alert;
    }
}
