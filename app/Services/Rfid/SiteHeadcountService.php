<?php

namespace App\Services\Rfid;

use App\Models\GateEntryExitLog;
use App\Models\RfidReader;
use App\Models\RfidTagLastSeen;
use App\Models\Site;
use App\Models\SiteHeadcountSnapshot;
use App\Models\WorkerRecord;

class SiteHeadcountService
{
    public function recordGateEvent(
        Site $site,
        string $tagEpc,
        string $direction,
        int $gateReaderId,
        ?WorkerRecord $worker,
    ): void {
        GateEntryExitLog::query()->create([
            'site_id' => $site->id,
            'tag_epc' => $tagEpc,
            'worker_record_id' => $worker?->id,
            'direction' => $direction,
            'occurred_at' => now(),
            'gate_reader_id' => $gateReaderId,
        ]);

        $isOnSite = $direction === 'entry';

        RfidTagLastSeen::query()->updateOrCreate(
            ['site_id' => $site->id, 'tag_epc' => $tagEpc],
            [
                'worker_record_id' => $worker?->id,
                'rfid_zone_id' => RfidReader::query()->find($gateReaderId)?->rfid_zone_id,
                'rfid_reader_id' => $gateReaderId,
                'is_on_site' => $isOnSite,
                'last_seen_at' => now(),
                'stationary_since' => null,
            ],
        );

        $this->snapshot($site, 'gate');
    }

    public function onSiteCount(Site $site): int
    {
        return RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('is_on_site', true)
            ->count();
    }

    public function snapshot(Site $site, string $source = 'gate'): SiteHeadcountSnapshot
    {
        $byZone = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('is_on_site', true)
            ->get()
            ->groupBy('rfid_zone_id')
            ->map(fn ($group) => $group->count())
            ->all();

        return SiteHeadcountSnapshot::query()->create([
            'site_id' => $site->id,
            'recorded_at' => now(),
            'on_site_count' => $this->onSiteCount($site),
            'by_zone' => $byZone,
            'source' => $source,
        ]);
    }
}
