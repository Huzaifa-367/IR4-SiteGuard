<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\DetectionModule;
use App\Models\RfidTagLastSeen;
use App\Services\Rfid\VisionRfidCorrelationService;
use App\Support\LsrAutoLog;
use App\Support\SiteRuleResolver;
use DateTimeInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class StationaryTagWatchJob implements ShouldQueue
{
    use Queueable;

    public function handle(VisionRfidCorrelationService $correlation): void
    {
        $module = DetectionModule::query()->where('key', 'rfid_ssms')->first();

        if ($module === null) {
            return;
        }

        $tags = RfidTagLastSeen::query()
            ->where('is_on_site', true)
            ->whereNotNull('stationary_since')
            ->with(['worker:id,full_name', 'rfidZone:id,name'])
            ->get();

        foreach ($tags as $tag) {
            $rule = SiteRuleResolver::activeByMatch($tag->site_id, 'rfid_stationary_tag');

            if ($rule === null) {
                continue;
            }

            $thresholdSeconds = SiteRuleResolver::stationaryThresholdSeconds($rule);
            $cutoff = now()->subSeconds($thresholdSeconds);

            if ($tag->stationary_since === null || $tag->stationary_since->gt($cutoff)) {
                continue;
            }

            $workerName = $tag->worker?->full_name ?? $tag->tag_epc;
            $zoneName = $tag->rfidZone?->name ?? 'Unknown zone';
            $title = sprintf('Stationary tag alert — %s in %s', $workerName, $zoneName);

            if (Alert::query()
                ->where('rule_id', $rule->id)
                ->where('status', 'open')
                ->where('title', $title)
                ->exists()) {
                continue;
            }

            $alert = Alert::query()->create([
                'site_id' => $tag->site_id,
                'camera_id' => null,
                'detection_module_id' => $module->id,
                'rule_id' => $rule->id,
                'severity' => $rule->severity,
                'status' => 'open',
                'title' => $title,
                'first_detection_event_id' => null,
                'occurrence_count' => 1,
                'opened_at' => now(),
                'metadata' => [
                    'tag_epc' => $tag->tag_epc,
                    'worker_record_id' => $tag->worker_record_id,
                    'rfid_zone_id' => $tag->rfid_zone_id,
                    'stationary_since' => $tag->stationary_since instanceof DateTimeInterface
                        ? $tag->stationary_since->format(DateTimeInterface::ATOM)
                        : $tag->stationary_since,
                ],
            ]);

            LsrAutoLog::fromAlert($alert, $tag->rfid_zone_id);

            $correlation->processNewAlert($alert);
        }
    }
}
