<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreRfidZoneRequest;
use App\Http\Requests\StoreWorkerRecordRequest;
use App\Http\Requests\UpdateEvacuationMusterRequest;
use App\Http\Requests\UpdateWorkerPortableDevicesRequest;
use App\Models\EvacuationReport;
use App\Models\GateEntryExitLog;
use App\Models\LsrViolationLog;
use App\Models\RfidTagLastSeen;
use App\Models\RfidZone;
use App\Models\WorkerRecord;
use App\Services\Rfid\SiteHeadcountService;
use App\Support\Iot\IotTimeRange;
use App\Support\Iot\RfidSiteData;
use App\Support\IotAnalytics;
use App\Support\SiteGuardEnums;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RfidOperationsController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:rfid.view', only: ['overview', 'zones', 'showZone', 'personnel']),
            new Middleware('permission:rfid.view|workers.manage', only: ['workers', 'showWorker']),
            new Middleware('permission:workers.manage', only: ['storeWorker']),
            new Middleware('permission:portable_devices.manage|workers.manage', only: ['portableDevices', 'updatePortableDevices']),
            new Middleware('permission:rfid_zones.manage', only: ['storeZone']),
            new Middleware('permission:gate_log.view', only: ['gateLog', 'showGateLog']),
            new Middleware('permission:evacuation.generate', only: [
                'evacuations', 'generateEvacuation', 'showEvacuation', 'updateEvacuationMuster', 'exportEvacuation',
            ]),
        ];
    }

    public function overview(Request $request, SiteHeadcountService $headcount, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        $selectedDays = IotTimeRange::chartDaysFromRequest($request);
        $chartDays = IotTimeRange::effectiveChartDays($selectedDays);

        return Inertia::render('iot/rfid/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'onSiteCount' => $headcount->onSiteCount($site),
            'permissions' => $data->permissions($request->user()),
            'analytics' => $iotAnalytics->rfidPageAnalytics($site->id, $chartDays, $selectedDays),
            'filters' => IotTimeRange::chartFilters($request),
        ]);
    }

    public function zones(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $zoneQuery = $site->rfidZones()->withCount(['readers'])->orderBy('name');
        IotTimeRange::applySince($zoneQuery, 'created_at', $listDays);

        $zones = $zoneQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(function ($zone) use ($site): array {
                $onSiteCount = RfidTagLastSeen::query()
                    ->where('site_id', $site->id)
                    ->where('rfid_zone_id', $zone->id)
                    ->where('is_on_site', true)
                    ->count();

                return [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'code' => $zone->code,
                    'zone_type' => $zone->zone_type,
                    'max_occupancy' => $zone->max_occupancy,
                    'on_site_count' => $onSiteCount,
                    'readers_count' => $zone->readers_count,
                ];
            });

        return Inertia::render('iot/rfid/zones', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'zones' => $zones,
            'filters' => IotTimeRange::listFilters($request),
            'permissions' => $data->permissions($request->user()),
            ...$data->enumOptions(),
        ]);
    }

    public function workers(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $workerQuery = WorkerRecord::query()
            ->where('site_id', $site->id)
            ->where('is_active', true)
            ->orderBy('full_name');

        IotTimeRange::applySince($workerQuery, 'updated_at', $listDays);

        $workers = $workerQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (WorkerRecord $worker): array => [
                'id' => $worker->id,
                'full_name' => $worker->full_name,
                'contractor' => $worker->contractor,
                'tag_epc' => $worker->tag_epc,
                'portable_device_approved' => $worker->portable_device_approved,
                'role' => $worker->role,
            ]);

        return Inertia::render('iot/rfid/workers', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'workers' => $workers,
            'filters' => IotTimeRange::listFilters($request),
            'permissions' => $data->permissions($request->user()),
            ...$data->enumOptions(),
        ]);
    }

    public function portableDevices(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $workerQuery = WorkerRecord::query()
            ->where('site_id', $site->id)
            ->where('is_active', true)
            ->orderBy('full_name');

        IotTimeRange::applySince($workerQuery, 'updated_at', $listDays);

        $portableRegister = $workerQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (WorkerRecord $worker): array => [
                'id' => $worker->id,
                'full_name' => $worker->full_name,
                'contractor' => $worker->contractor,
                'portable_device_approved' => $worker->portable_device_approved,
                'portable_devices' => $worker->portable_devices ?? [],
            ]);

        return Inertia::render('iot/rfid/portable-devices', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'portableRegister' => $portableRegister,
            'filters' => IotTimeRange::listFilters($request),
            'permissions' => $data->permissions($request->user()),
            ...$data->enumOptions(),
        ]);
    }

    public function personnel(Request $request, SiteHeadcountService $headcount): Response
    {
        $site = $this->selectedSite($request);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $personnelQuery = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('is_on_site', true)
            ->with(['worker:id,full_name,contractor,role', 'rfidZone:id,name'])
            ->orderByDesc('last_seen_at');

        IotTimeRange::applySince($personnelQuery, 'last_seen_at', $listDays);

        $rfidData = new RfidSiteData($site);

        $onSitePersonnel = $personnelQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (RfidTagLastSeen $row): array => $rfidData->presentOnSitePerson($row));

        return Inertia::render('iot/rfid/personnel', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'onSiteCount' => $headcount->onSiteCount($site),
            'onSitePersonnel' => $onSitePersonnel,
            'filters' => IotTimeRange::listFilters($request),
        ]);
    }

    public function gateLog(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $query = GateEntryExitLog::query()
            ->where('site_id', $site->id)
            ->with('worker:id,full_name')
            ->orderByDesc('occurred_at');

        IotTimeRange::applySince($query, 'occurred_at', $listDays);

        $gateLog = $query
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (GateEntryExitLog $log): array => [
                'id' => $log->id,
                'tag_epc' => $log->tag_epc,
                'worker_id' => $log->worker_record_id,
                'worker' => $log->worker?->full_name,
                'direction' => $log->direction,
                'occurred_at' => $log->occurred_at->toIso8601String(),
            ]);

        return Inertia::render('iot/rfid/gate-log', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'gateLog' => $gateLog,
            'filters' => IotTimeRange::listFilters($request),
        ]);
    }

    public function showZone(Request $request, RfidZone $zone, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $zone->site_id === (int) $site->id, 404);

        [$mapLat, $mapLng] = $iotAnalytics->resolveZoneMapCoordinates($zone, $site);

        $onSiteCount = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('rfid_zone_id', $zone->id)
            ->where('is_on_site', true)
            ->count();

        $readers = $zone->readers()
            ->orderBy('code')
            ->get(['id', 'name', 'code', 'mount_type', 'health_status', 'last_ingest_at'])
            ->map(fn ($reader): array => [
                'id' => $reader->id,
                'name' => $reader->name,
                'code' => $reader->code,
                'mount_type' => $reader->mount_type,
                'health_status' => $reader->health_status,
                'last_ingest_at' => $reader->last_ingest_at?->toIso8601String(),
            ])
            ->all();

        $authorizedWorkerIds = collect($zone->authorized_worker_ids ?? []);
        $authorizedWorkers = WorkerRecord::query()
            ->where('site_id', $site->id)
            ->whereIn('id', $authorizedWorkerIds)
            ->orderBy('full_name')
            ->get(['id', 'full_name', 'contractor', 'role', 'tag_epc'])
            ->all();

        $onSitePersonnel = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('rfid_zone_id', $zone->id)
            ->where('is_on_site', true)
            ->with(['worker:id,full_name,contractor,role'])
            ->orderByDesc('last_seen_at')
            ->limit(25)
            ->get()
            ->map(fn (RfidTagLastSeen $row): array => [
                'worker_id' => $row->worker_record_id,
                'tag_epc' => $row->tag_epc,
                'worker' => $row->worker?->full_name,
                'contractor' => $row->worker?->contractor,
                'role' => $row->worker?->role,
                'last_seen_at' => $row->last_seen_at->toIso8601String(),
            ])
            ->all();

        return Inertia::render('iot/rfid-zone-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'zone' => [
                'id' => $zone->id,
                'name' => $zone->name,
                'code' => $zone->code,
                'zone_type' => $zone->zone_type,
                'max_occupancy' => $zone->max_occupancy,
                'is_active' => $zone->is_active,
                'map_lat' => $mapLat,
                'map_lng' => $mapLng,
                'on_site_count' => $onSiteCount,
            ],
            'siteMapCenter' => $site->map_center_lat !== null && $site->map_center_lng !== null
                ? ['lat' => (float) $site->map_center_lat, 'lng' => (float) $site->map_center_lng]
                : null,
            'readers' => $readers,
            'authorizedWorkers' => $authorizedWorkers,
            'onSitePersonnel' => $onSitePersonnel,
        ]);
    }

    public function showWorker(Request $request, WorkerRecord $worker): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $worker->site_id === (int) $site->id, 404);

        $lastSeen = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('worker_record_id', $worker->id)
            ->with(['rfidZone:id,name,code', 'reader:id,name,code'])
            ->first();

        $authorizedZones = RfidZone::query()
            ->where('site_id', $site->id)
            ->whereIn('id', collect($worker->authorized_zone_ids ?? []))
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'zone_type'])
            ->all();

        $gateHistory = GateEntryExitLog::query()
            ->where('site_id', $site->id)
            ->where('worker_record_id', $worker->id)
            ->with('gateReader:id,name,code')
            ->orderByDesc('occurred_at')
            ->limit(100)
            ->get()
            ->map(fn (GateEntryExitLog $log): array => [
                'id' => $log->id,
                'direction' => $log->direction,
                'occurred_at' => $log->occurred_at->toIso8601String(),
                'gate_reader' => $log->gateReader ? [
                    'id' => $log->gateReader->id,
                    'name' => $log->gateReader->name,
                    'code' => $log->gateReader->code,
                ] : null,
            ])
            ->all();

        $lsrViolations = LsrViolationLog::query()
            ->where('site_id', $site->id)
            ->whereJsonContains('worker_record_ids', $worker->id)
            ->orderByDesc('occurred_at')
            ->limit(15)
            ->get(['id', 'lsr_category', 'detection_mode', 'occurred_at', 'description'])
            ->map(fn (LsrViolationLog $log): array => [
                'id' => $log->id,
                'lsr_category' => $log->lsr_category,
                'detection_mode' => $log->detection_mode,
                'occurred_at' => $log->occurred_at->toIso8601String(),
                'description' => $log->description,
            ])
            ->all();

        return Inertia::render('iot/rfid-worker-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'worker' => [
                'id' => $worker->id,
                'tag_epc' => $worker->tag_epc,
                'employee_number' => $worker->employee_number,
                'full_name' => $worker->full_name,
                'contractor' => $worker->contractor,
                'role' => $worker->role,
                'nationality' => $worker->nationality,
                'is_active' => $worker->is_active,
                'portable_device_approved' => $worker->portable_device_approved,
                'portable_devices' => $worker->portable_devices ?? [],
            ],
            'lastSeen' => $lastSeen ? [
                'is_on_site' => $lastSeen->is_on_site,
                'last_seen_at' => $lastSeen->last_seen_at->toIso8601String(),
                'zone' => $lastSeen->rfidZone ? [
                    'id' => $lastSeen->rfidZone->id,
                    'name' => $lastSeen->rfidZone->name,
                    'code' => $lastSeen->rfidZone->code,
                ] : null,
                'reader' => $lastSeen->reader ? [
                    'id' => $lastSeen->reader->id,
                    'name' => $lastSeen->reader->name,
                    'code' => $lastSeen->reader->code,
                ] : null,
            ] : null,
            'authorizedZones' => $authorizedZones,
            'gateHistory' => $gateHistory,
            'lsrViolations' => $lsrViolations,
            'permissions' => (new RfidSiteData($site))->permissions($request->user()),
        ]);
    }

    public function showGateLog(Request $request, GateEntryExitLog $log): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $log->site_id === (int) $site->id, 404);

        $log->load(['worker:id,full_name,contractor,role,tag_epc', 'gateReader:id,name,code,mount_type']);

        return Inertia::render('iot/gate-log-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'entry' => [
                'id' => $log->id,
                'tag_epc' => $log->tag_epc,
                'direction' => $log->direction,
                'occurred_at' => $log->occurred_at->toIso8601String(),
            ],
            'worker' => $log->worker ? [
                'id' => $log->worker->id,
                'full_name' => $log->worker->full_name,
                'contractor' => $log->worker->contractor,
                'role' => $log->worker->role,
                'tag_epc' => $log->worker->tag_epc,
            ] : null,
            'gateReader' => $log->gateReader ? [
                'id' => $log->gateReader->id,
                'name' => $log->gateReader->name,
                'code' => $log->gateReader->code,
                'mount_type' => $log->gateReader->mount_type,
            ] : null,
        ]);
    }

    public function evacuations(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);
        $listDays = IotTimeRange::listDaysFromRequest($request);

        $reportQuery = EvacuationReport::query()
            ->where('site_id', $site->id)
            ->orderByDesc('generated_at');

        IotTimeRange::applySince($reportQuery, 'generated_at', $listDays);

        $evacuationReports = $reportQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (EvacuationReport $report): array => [
                'id' => $report->id,
                'generated_at' => $report->generated_at->toIso8601String(),
                'on_site_count' => $report->snapshot['on_site_count'] ?? 0,
                'accounted' => collect($report->muster_status ?? [])->where('status', 'accounted')->count(),
            ]);

        return Inertia::render('iot/rfid/evacuations', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'evacuationReports' => $evacuationReports,
            'filters' => IotTimeRange::listFilters($request),
            'permissions' => $data->permissions($request->user()),
        ]);
    }

    public function showEvacuation(Request $request, EvacuationReport $report): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        $personnel = collect($report->snapshot['personnel'] ?? []);
        $muster = collect($report->muster_status ?? [])->keyBy('tag_epc');

        $rows = $personnel->map(function (array $person) use ($muster): array {
            $status = $muster->get($person['tag_epc']);

            return [
                'tag_epc' => $person['tag_epc'],
                'worker' => $person['worker'] ?? null,
                'contractor' => $person['contractor'] ?? null,
                'last_zone' => $person['last_zone'] ?? null,
                'last_seen_at' => $person['last_seen_at'] ?? null,
                'status' => $status['status'] ?? 'unknown',
                'muster_point' => $status['muster_point'] ?? null,
                'notes' => $status['notes'] ?? null,
            ];
        });

        return Inertia::render('iot/rfid-evacuation', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'musterStatusOptions' => SiteGuardEnums::options('muster_statuses'),
            'report' => [
                'id' => $report->id,
                'generated_at' => $report->generated_at->toIso8601String(),
                'on_site_count' => $report->snapshot['on_site_count'] ?? $rows->count(),
                'personnel' => $rows->values()->all(),
            ],
            'permissions' => [
                'canUpdateMuster' => $request->user()?->can('evacuation.generate') ?? false,
            ],
        ]);
    }

    public function storeWorker(StoreWorkerRecordRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->workerRecords()->create($request->validated());

        return $this->redirect(__('Worker registered.'), 'iot.rfid.workers.index');
    }

    public function updatePortableDevices(
        UpdateWorkerPortableDevicesRequest $request,
        WorkerRecord $worker,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $worker->site_id === (int) $site->id, 404);

        $worker->update($request->validated());

        return $this->redirect(__('Portable device register updated.'), 'iot.rfid.portable-devices.index');
    }

    public function storeZone(StoreRfidZoneRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->rfidZones()->create($request->validated());

        return $this->redirect(__('RFID zone created.'), 'iot.rfid.zones.index');
    }

    public function generateEvacuation(Request $request): RedirectResponse
    {
        $site = $this->selectedSite($request);

        $onSite = RfidTagLastSeen::query()
            ->where('site_id', $site->id)
            ->where('is_on_site', true)
            ->with(['worker:id,full_name,contractor', 'rfidZone:id,name'])
            ->get()
            ->map(fn (RfidTagLastSeen $row): array => [
                'tag_epc' => $row->tag_epc,
                'worker' => $row->worker?->full_name,
                'contractor' => $row->worker?->contractor,
                'last_zone' => $row->rfidZone?->name,
                'last_seen_at' => $row->last_seen_at->toIso8601String(),
            ]);

        $report = EvacuationReport::query()->create([
            'site_id' => $site->id,
            'generated_by_user_id' => $request->user()?->id,
            'generated_at' => now(),
            'snapshot' => [
                'on_site_count' => $onSite->count(),
                'personnel' => $onSite->all(),
            ],
            'muster_status' => $onSite->map(fn (array $person): array => [
                'tag_epc' => $person['tag_epc'],
                'status' => 'unknown',
            ])->all(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Evacuation report generated for :count personnel.', ['count' => $onSite->count()]),
        ]);

        return to_route('iot.rfid.evacuation.show', $report);
    }

    public function exportEvacuation(Request $request, EvacuationReport $report): StreamedResponse
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        $snapshot = $report->snapshot ?? [];
        $personnel = collect($snapshot['personnel'] ?? []);
        $muster = collect($report->muster_status ?? [])->keyBy('tag_epc');

        $rows = $personnel->map(fn (array $person): array => [
            ...$person,
            'muster_status' => $muster->get($person['tag_epc'])['status'] ?? 'unknown',
        ])->all();

        $html = View::make('reports.evacuation', [
            'siteName' => $site->name,
            'generatedAt' => $report->generated_at?->toDateTimeString() ?? '',
            'onSiteCount' => $snapshot['on_site_count'] ?? count($rows),
            'personnel' => $rows,
        ])->render();

        $filename = sprintf('evacuation-%s-%s.html', $site->code ?? $site->id, $report->generated_at?->format('Y-m-d-His'));

        return response()->streamDownload(
            fn () => print $html,
            $filename,
            ['Content-Type' => 'text/html'],
        );
    }

    public function updateEvacuationMuster(
        UpdateEvacuationMusterRequest $request,
        EvacuationReport $report,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $report->site_id === (int) $site->id, 404);

        $report->update([
            'muster_status' => $request->validated('personnel'),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Muster status saved.'),
        ]);

        return to_route('iot.rfid.evacuation.show', $report);
    }

    private function redirect(string $message, string $route): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route($route);
    }
}
