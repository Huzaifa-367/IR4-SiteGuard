<?php

namespace App\Support\Iot;

use App\Models\EvacuationReport;
use App\Models\GateEntryExitLog;
use App\Models\RfidTagLastSeen;
use App\Models\Site;
use App\Models\WorkerRecord;
use App\Support\SiteGuardEnums;
use Carbon\CarbonInterface;

class RfidSiteData
{
    private CarbonInterface $staleThreshold;

    private CarbonInterface $stationaryThreshold;

    public function __construct(private readonly Site $site)
    {
        $this->staleThreshold = now()->subSeconds((int) config('siteguard.rfid_stale_threshold_seconds', 1800));
        $this->stationaryThreshold = now()->subSeconds((int) config('siteguard.rfid_stationary_min_seconds', 1200));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function zones(): array
    {
        return $this->site->rfidZones()
            ->withCount(['readers'])
            ->orderBy('name')
            ->get()
            ->map(function ($zone): array {
                $count = RfidTagLastSeen::query()
                    ->where('site_id', $this->site->id)
                    ->where('rfid_zone_id', $zone->id)
                    ->where('is_on_site', true)
                    ->count();

                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'code' => $zone->code,
                    'zone_type' => $zone->zone_type,
                    'max_occupancy' => $zone->max_occupancy,
                    'on_site_count' => $count,
                    'readers_count' => $zone->readers_count,
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function onSitePersonnel(): array
    {
        return RfidTagLastSeen::query()
            ->where('site_id', $this->site->id)
            ->where('is_on_site', true)
            ->with(['worker:id,full_name,contractor,role', 'rfidZone:id,name'])
            ->orderByDesc('last_seen_at')
            ->get()
            ->map(fn (RfidTagLastSeen $row): array => $this->presentOnSitePerson($row))
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function workers(): array
    {
        return WorkerRecord::query()
            ->where('site_id', $this->site->id)
            ->where('is_active', true)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'contractor', 'tag_epc', 'portable_device_approved', 'portable_devices', 'role'])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function portableRegister(): array
    {
        return WorkerRecord::query()
            ->where('site_id', $this->site->id)
            ->where('is_active', true)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'contractor', 'portable_device_approved', 'portable_devices'])
            ->map(fn (WorkerRecord $worker): array => [
                'id' => $worker->id,
                'full_name' => $worker->full_name,
                'contractor' => $worker->contractor,
                'portable_device_approved' => $worker->portable_device_approved,
                'portable_devices' => $worker->portable_devices ?? [],
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function evacuationReports(int $limit = 50): array
    {
        return EvacuationReport::query()
            ->where('site_id', $this->site->id)
            ->orderByDesc('generated_at')
            ->limit($limit)
            ->get()
            ->map(fn (EvacuationReport $report): array => [
                'id' => $report->id,
                'generated_at' => $report->generated_at->toIso8601String(),
                'on_site_count' => $report->snapshot['on_site_count'] ?? 0,
                'accounted' => collect($report->muster_status ?? [])->where('status', 'accounted')->count(),
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function gateLog(int $limit = 100): array
    {
        return GateEntryExitLog::query()
            ->where('site_id', $this->site->id)
            ->with('worker:id,full_name')
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (GateEntryExitLog $log): array => [
                'id' => $log->id,
                'tag_epc' => $log->tag_epc,
                'worker_id' => $log->worker_record_id,
                'worker' => $log->worker?->full_name,
                'direction' => $log->direction,
                'occurred_at' => $log->occurred_at->toIso8601String(),
            ])
            ->all();
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public function contractorOptions(): array
    {
        return WorkerRecord::query()
            ->where('site_id', $this->site->id)
            ->whereNotNull('contractor')
            ->distinct()
            ->orderBy('contractor')
            ->pluck('contractor')
            ->filter()
            ->values()
            ->map(fn (string $contractor): array => ['value' => $contractor, 'label' => $contractor])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function enumOptions(): array
    {
        return [
            'zoneTypeOptions' => SiteGuardEnums::options('rfid_zone_types'),
            'portableDeviceTypeOptions' => SiteGuardEnums::options('portable_device_types'),
            'contractorOptions' => $this->contractorOptions(),
        ];
    }

    /**
     * @return array<string, bool>
     */
    public function permissions(?object $user): array
    {
        return [
            'canManageWorkers' => $user?->can('workers.manage') ?? false,
            'canManageZones' => $user?->can('rfid_zones.manage') ?? false,
            'canEvacuate' => $user?->can('evacuation.generate') ?? false,
            'canManagePortable' => ($user?->can('portable_devices.manage') || $user?->can('workers.manage')) ?? false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function presentOnSitePerson(RfidTagLastSeen $row): array
    {
        $isStale = $row->last_seen_at < $this->staleThreshold;
        $isStationary = $row->stationary_since !== null && $row->stationary_since <= $this->stationaryThreshold;

        return [
            'tag_epc' => $row->tag_epc,
            'worker_id' => $row->worker_record_id,
            'worker' => $row->worker?->full_name,
            'contractor' => $row->worker?->contractor,
            'role' => $row->worker?->role,
            'zone_id' => $row->rfid_zone_id,
            'zone' => $row->rfidZone?->name,
            'last_seen_at' => $row->last_seen_at->toIso8601String(),
            'is_stale' => $isStale,
            'is_stationary' => $isStationary,
        ];
    }
}
