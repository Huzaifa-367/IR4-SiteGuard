<?php

namespace App\Services\Rfid;

use App\Http\Controllers\HseIncidentController;
use App\Models\Alert;
use App\Models\HseIncident;
use App\Models\LsrViolationLog;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\WorkerRecord;
use App\Support\SiteRuleResolver;

class VisionRfidCorrelationService
{
    public function processNewAlert(Alert $alert): void
    {
        $alert->loadMissing('rule');

        if (SiteRuleResolver::ruleHasMatch($alert->rule, SiteRuleResolver::correlationMatches('fall'))) {
            $this->handleFallAlert($alert);

            return;
        }

        if (SiteRuleResolver::ruleHasMatch($alert->rule, SiteRuleResolver::correlationMatches('stationary'))) {
            $this->handleStationaryAlert($alert);

            return;
        }

        if (SiteRuleResolver::ruleHasMatch($alert->rule, SiteRuleResolver::correlationMatches('harness'))
            || str_contains(strtolower($alert->title), 'harness')) {
            $this->handleHarnessHeightCheck($alert);
        }
    }

    private function handleFallAlert(Alert $alert): void
    {
        $correlated = $this->findCorrelatedStationaryAlert($alert);

        $workers = $this->workersNearCamera($alert);

        $incident = HseIncidentController::createDraftFromAlert(
            $alert->site_id,
            'fall_detected',
            $alert->title,
            $alert->id,
            null,
            $alert->camera_id,
        );

        $incident->update([
            'metadata' => array_merge($incident->metadata ?? [], [
                'correlated_stationary_alert_id' => $correlated?->id,
                'workers_near_camera' => $workers,
            ]),
        ]);

        if ($correlated !== null) {
            LsrViolationLog::query()->firstOrCreate(
                ['alert_id' => $correlated->id],
                [
                    'site_id' => $correlated->site_id,
                    'lsr_category' => 'LSR-WD-001',
                    'detection_mode' => 'automated',
                    'occurred_at' => $correlated->opened_at ?? now(),
                    'camera_id' => $correlated->camera_id,
                    'description' => $correlated->title,
                ],
            );
        }
    }

    private function handleStationaryAlert(Alert $alert): void
    {
        $correlated = $this->findCorrelatedFallAlert($alert);

        if ($correlated === null) {
            return;
        }

        $existing = HseIncident::query()
            ->where('site_id', $alert->site_id)
            ->where('metadata->correlated_stationary_alert_id', $alert->id)
            ->first();

        if ($existing !== null) {
            return;
        }

        HseIncidentController::createDraftFromAlert(
            $alert->site_id,
            'stationary_tag',
            sprintf('Correlated fall + stationary — %s', $alert->title),
            $correlated->id,
            $alert->metadata['rfid_zone_id'] ?? null,
            $correlated->camera_id,
        );
    }

    private function handleHarnessHeightCheck(Alert $alert): void
    {
        $heightZoneIds = RfidZone::query()
            ->where('site_id', $alert->site_id)
            ->where('zone_type', 'height_work')
            ->pluck('id');

        $workersInHeight = RfidTagLastSeen::query()
            ->where('site_id', $alert->site_id)
            ->where('is_on_site', true)
            ->whereIn('rfid_zone_id', $heightZoneIds)
            ->with('worker:id,full_name,contractor,role')
            ->get();

        if ($workersInHeight->isEmpty()) {
            return;
        }

        LsrViolationLog::query()->firstOrCreate(
            ['alert_id' => $alert->id],
            [
                'site_id' => $alert->site_id,
                'lsr_category' => 'LSR-PPE-001',
                'detection_mode' => 'automated',
                'occurred_at' => $alert->opened_at ?? now(),
                'alert_id' => $alert->id,
                'camera_id' => $alert->camera_id,
                'worker_record_ids' => $workersInHeight->pluck('worker_record_id')->filter()->values()->all(),
                'description' => 'Working at height without harness — correlated RFID height zone occupancy',
            ],
        );
    }

    private function findCorrelatedStationaryAlert(Alert $fallAlert): ?Alert
    {
        $windowSeconds = SiteRuleResolver::correlationWindowSeconds();
        $windowStart = ($fallAlert->opened_at ?? now())->copy()->subSeconds($windowSeconds);
        $windowEnd = ($fallAlert->opened_at ?? now())->copy()->addSeconds($windowSeconds);

        return Alert::query()
            ->where('site_id', $fallAlert->site_id)
            ->where('status', 'open')
            ->whereHas('rule', fn ($q) => SiteRuleResolver::scopeRulesByMatch($q, SiteRuleResolver::correlationMatches('stationary')))
            ->whereBetween('opened_at', [$windowStart, $windowEnd])
            ->first();
    }

    private function findCorrelatedFallAlert(Alert $stationaryAlert): ?Alert
    {
        $windowSeconds = SiteRuleResolver::correlationWindowSeconds();
        $windowStart = ($stationaryAlert->opened_at ?? now())->copy()->subSeconds($windowSeconds);
        $windowEnd = ($stationaryAlert->opened_at ?? now())->copy()->addSeconds($windowSeconds);

        return Alert::query()
            ->where('site_id', $stationaryAlert->site_id)
            ->whereHas('rule', fn ($q) => SiteRuleResolver::scopeRulesByMatch($q, SiteRuleResolver::correlationMatches('fall')))
            ->whereBetween('opened_at', [$windowStart, $windowEnd])
            ->first();
    }

    /**
     * @return list<array{name: string, contractor: string|null, role: string|null, rfid_zone_id: int|null}>
     */
    private function workersNearCamera(Alert $alert): array
    {
        if ($alert->camera_id === null) {
            return $this->workersFromAlertMetadata($alert);
        }

        $heightZoneIds = RfidZone::query()
            ->where('site_id', $alert->site_id)
            ->whereIn('zone_type', ['height_work', 'general'])
            ->pluck('id');

        return RfidTagLastSeen::query()
            ->where('site_id', $alert->site_id)
            ->where('is_on_site', true)
            ->whereIn('rfid_zone_id', $heightZoneIds)
            ->with('worker:id,full_name,contractor,role')
            ->limit(5)
            ->get()
            ->map(fn (RfidTagLastSeen $tag): array => [
                'name' => $tag->worker?->full_name ?? $tag->tag_epc,
                'contractor' => $tag->worker?->contractor,
                'role' => $tag->worker?->role,
                'rfid_zone_id' => $tag->rfid_zone_id,
            ])
            ->all();
    }

    /**
     * @return list<array{name: string, contractor: string|null, role: string|null, rfid_zone_id: int|null}>
     */
    private function workersFromAlertMetadata(Alert $alert): array
    {
        $workerId = $alert->metadata['worker_record_id'] ?? null;

        if ($workerId === null) {
            return [];
        }

        $worker = WorkerRecord::query()->find($workerId);

        if ($worker === null) {
            return [];
        }

        return [[
            'name' => $worker->full_name,
            'contractor' => $worker->contractor,
            'role' => $worker->role,
            'rfid_zone_id' => $alert->metadata['rfid_zone_id'] ?? null,
        ]];
    }
}
