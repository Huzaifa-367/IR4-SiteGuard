<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\DetectionModule;
use App\Models\RfidReader;
use App\Models\RfidReadEvent;
use App\Models\RfidTagLastSeen;
use App\Models\WorkerRecord;
use App\Support\LsrAutoLog;
use App\Support\SiteRuleResolver;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class EvaluateRfidRulesJob implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly int $readerId,
        public readonly string $batchId,
    ) {}

    public function handle(): void
    {
        $reader = RfidReader::query()->with(['site', 'rfidZone'])->find($this->readerId);

        if ($reader === null) {
            return;
        }

        $module = DetectionModule::query()->where('key', 'rfid_ssms')->first();

        if ($module === null) {
            return;
        }

        $events = RfidReadEvent::query()
            ->where('batch_id', $this->batchId)
            ->where('rfid_reader_id', $reader->id)
            ->get();

        foreach ($events as $event) {
            $this->evaluateUnknownEpc($reader, $event, $module);
            $this->evaluateUnapprovedPortable($reader, $event, $module);
            $this->evaluateUnauthorizedZone($reader, $event, $module);
            $this->evaluateZoneOccupancy($reader, $module);
        }
    }

    private function evaluateUnknownEpc(RfidReader $reader, RfidReadEvent $event, DetectionModule $module): void
    {
        if ($event->worker_record_id !== null) {
            return;
        }

        $rule = SiteRuleResolver::activeByMatch($reader->site_id, 'rfid_unknown_epc');

        if ($rule === null) {
            return;
        }

        $title = sprintf('Unknown RFID tag detected — %s', $event->tag_epc);

        if (Alert::query()->where('rule_id', $rule->id)->where('status', 'open')->where('title', $title)->exists()) {
            return;
        }

        Alert::query()->create([
            'site_id' => $reader->site_id,
            'camera_id' => null,
            'detection_module_id' => $module->id,
            'rule_id' => $rule->id,
            'severity' => $rule->severity,
            'status' => 'open',
            'title' => $title,
            'first_detection_event_id' => null,
            'occurrence_count' => 1,
            'opened_at' => now(),
            'metadata' => ['tag_epc' => $event->tag_epc, 'rfid_zone_id' => $reader->rfid_zone_id],
        ]);
    }

    private function evaluateUnapprovedPortable(RfidReader $reader, RfidReadEvent $event, DetectionModule $module): void
    {
        if ($event->worker_record_id === null) {
            return;
        }

        $worker = WorkerRecord::query()->find($event->worker_record_id);

        if ($worker === null || $worker->portable_device_approved) {
            return;
        }

        $rule = SiteRuleResolver::activeByMatch($reader->site_id, 'rfid_unapproved_portable');

        if ($rule === null) {
            return;
        }

        $title = sprintf('Unapproved portable device — %s', $worker->full_name);

        if (Alert::query()->where('rule_id', $rule->id)->where('status', 'open')->where('title', $title)->exists()) {
            return;
        }

        Alert::query()->create([
            'site_id' => $reader->site_id,
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
                'tag_epc' => $event->tag_epc,
                'worker_record_id' => $worker->id,
                'rfid_zone_id' => $reader->rfid_zone_id,
            ],
        ]);
    }

    private function evaluateUnauthorizedZone(RfidReader $reader, RfidReadEvent $event, DetectionModule $module): void
    {
        $zone = $reader->rfidZone;

        if ($zone === null || ! SiteRuleResolver::isRestrictedZoneType($zone->zone_type)) {
            return;
        }

        $allowed = collect($zone->authorized_worker_ids ?? []);

        $worker = $event->worker_record_id
            ? WorkerRecord::query()->find($event->worker_record_id)
            : null;

        if ($worker !== null && $allowed->contains($worker->id)) {
            return;
        }

        $rule = SiteRuleResolver::activeByMatch($reader->site_id, 'rfid_unauthorized_zone');

        if ($rule === null) {
            return;
        }

        $title = sprintf('Unauthorized zone entry — %s', $zone->name);

        if (Alert::query()->where('rule_id', $rule->id)->where('status', 'open')->where('title', $title)->exists()) {
            return;
        }

        Alert::query()->create([
            'site_id' => $reader->site_id,
            'camera_id' => null,
            'detection_module_id' => $module->id,
            'rule_id' => $rule->id,
            'severity' => $rule->severity,
            'status' => 'open',
            'title' => $title,
            'first_detection_event_id' => null,
            'occurrence_count' => 1,
            'opened_at' => now(),
        ]);

        $alert = Alert::query()
            ->where('rule_id', $rule->id)
            ->where('status', 'open')
            ->where('title', $title)
            ->latest('id')
            ->first();

        if ($alert !== null) {
            LsrAutoLog::fromAlert($alert, $zone->id);
        }
    }

    private function evaluateZoneOccupancy(RfidReader $reader, DetectionModule $module): void
    {
        $zone = $reader->rfidZone;

        if ($zone === null || $zone->max_occupancy === null) {
            return;
        }

        $count = RfidTagLastSeen::query()
            ->where('site_id', $reader->site_id)
            ->where('rfid_zone_id', $zone->id)
            ->where('is_on_site', true)
            ->count();

        if ($count <= $zone->max_occupancy) {
            return;
        }

        $rule = SiteRuleResolver::activeByMatch($reader->site_id, 'rfid_zone_occupancy');

        if ($rule === null) {
            return;
        }

        $title = sprintf('Zone occupancy exceeded — %s (%d/%d)', $zone->name, $count, $zone->max_occupancy);

        if (Alert::query()->where('rule_id', $rule->id)->where('status', 'open')->where('title', $title)->exists()) {
            return;
        }

        Alert::query()->create([
            'site_id' => $reader->site_id,
            'camera_id' => null,
            'detection_module_id' => $module->id,
            'rule_id' => $rule->id,
            'severity' => $rule->severity,
            'status' => 'open',
            'title' => $title,
            'first_detection_event_id' => null,
            'occurrence_count' => 1,
            'opened_at' => now(),
        ]);

        $alert = Alert::query()
            ->where('rule_id', $rule->id)
            ->where('status', 'open')
            ->where('title', $title)
            ->latest('id')
            ->first();

        if ($alert !== null) {
            LsrAutoLog::fromAlert($alert, $zone->id);
        }
    }
}
