<?php

namespace App\Support;

use App\Models\Alert;
use App\Models\LsrViolationLog;

class LsrAutoLog
{
    public static function fromAlert(Alert $alert, ?int $rfidZoneId = null): void
    {
        $alert->loadMissing('rule');

        $lsrCategory = SiteRuleResolver::lsrCategory($alert->rule);

        if ($lsrCategory === null) {
            return;
        }

        if (LsrViolationLog::query()->where('alert_id', $alert->id)->exists()) {
            return;
        }

        LsrViolationLog::query()->create([
            'site_id' => $alert->site_id,
            'lsr_category' => $lsrCategory,
            'detection_mode' => 'automated',
            'occurred_at' => $alert->opened_at ?? now(),
            'alert_id' => $alert->id,
            'rfid_zone_id' => $rfidZoneId,
            'camera_id' => $alert->camera_id,
            'description' => $alert->title,
        ]);
    }
}
