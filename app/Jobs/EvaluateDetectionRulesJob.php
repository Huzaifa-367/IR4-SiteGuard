<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\Camera;
use App\Models\DetectionEvent;
use App\Models\DetectionModule;
use App\Models\Rule;
use App\Services\Rfid\VisionRfidCorrelationService;
use App\Support\LsrAutoLog;
use App\Support\SiteRuleResolver;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EvaluateDetectionRulesJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $cameraId,
        public readonly string $ingestEventId,
    ) {}

    public function handle(VisionRfidCorrelationService $correlation): void
    {
        $camera = Camera::query()
            ->with(['zones.rules'])
            ->find($this->cameraId);

        if ($camera === null) {
            return;
        }

        $events = DetectionEvent::query()
            ->where('ingest_event_id', $this->ingestEventId)
            ->get();

        $incidentModule = DetectionModule::query()->where('key', 'incident_vision')->first();

        $siteIncidentRules = $incidentModule
            ? Rule::query()
                ->where('site_id', $camera->site_id)
                ->where('detection_module_id', $incidentModule->id)
                ->where('is_active', true)
                ->get()
            : collect();

        foreach ($events as $event) {
            $classKeys = collect($event->classes)->pluck('key')->filter()->all();

            foreach ($camera->zones as $zone) {
                if (! in_array($zone->id, $event->zone_ids ?? [], true)) {
                    continue;
                }

                foreach ($zone->rules as $rule) {
                    if (! $rule->is_active) {
                        continue;
                    }

                    $match = $rule->definition['match'] ?? null;

                    if ($match === null || ! in_array($match, $classKeys, true)) {
                        continue;
                    }

                    $this->openOrBumpAlert($camera, $event, $rule, $correlation);
                }
            }

            foreach ($siteIncidentRules as $rule) {
                $match = $rule->definition['match'] ?? null;

                if ($match === null || ! in_array($match, $classKeys, true)) {
                    continue;
                }

                $this->openOrBumpAlert($camera, $event, $rule, $correlation);
            }
        }
    }

    private function openOrBumpAlert(
        Camera $camera,
        DetectionEvent $event,
        Rule $rule,
        VisionRfidCorrelationService $correlation,
    ): void {
        $existing = Alert::query()
            ->where('rule_id', $rule->id)
            ->where('camera_id', $camera->id)
            ->where('status', 'open')
            ->first();

        if ($existing !== null) {
            $existing->update([
                'last_detection_event_id' => $event->id,
                'occurrence_count' => $existing->occurrence_count + 1,
            ]);

            return;
        }

        $alert = Alert::query()->create([
            'site_id' => $camera->site_id,
            'camera_id' => $camera->id,
            'detection_module_id' => $camera->detection_module_id,
            'rule_id' => $rule->id,
            'severity' => $rule->severity,
            'status' => 'open',
            'title' => $rule->name,
            'first_detection_event_id' => $event->id,
            'last_detection_event_id' => $event->id,
            'occurrence_count' => 1,
            'opened_at' => now(),
        ]);

        if (SiteRuleResolver::ruleHasMatch($rule, SiteRuleResolver::correlationMatches('fall'))
            || SiteRuleResolver::ruleHasMatch($rule, SiteRuleResolver::correlationMatches('harness'))
            || str_contains(strtolower($rule->name), 'harness')) {
            $correlation->processNewAlert($alert);
        } else {
            LsrAutoLog::fromAlert($alert);
        }
    }
}
