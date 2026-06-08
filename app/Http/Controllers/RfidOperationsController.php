<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreRfidZoneRequest;
use App\Http\Requests\StoreWorkerRecordRequest;
use App\Http\Requests\UpdateEvacuationMusterRequest;
use App\Http\Requests\UpdateWorkerPortableDevicesRequest;
use App\Models\EvacuationReport;
use App\Models\RfidTagLastSeen;
use App\Models\WorkerRecord;
use App\Services\Rfid\SiteHeadcountService;
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
            new Middleware('permission:rfid.view', only: ['overview', 'zones', 'personnel']),
            new Middleware('permission:rfid.view|workers.manage', only: ['workers']),
            new Middleware('permission:workers.manage', only: ['storeWorker']),
            new Middleware('permission:portable_devices.manage|workers.manage', only: ['portableDevices', 'updatePortableDevices']),
            new Middleware('permission:rfid_zones.manage', only: ['storeZone']),
            new Middleware('permission:gate_log.view', only: ['gateLog']),
            new Middleware('permission:evacuation.generate', only: [
                'evacuations', 'generateEvacuation', 'showEvacuation', 'updateEvacuationMuster', 'exportEvacuation',
            ]),
        ];
    }

    public function overview(Request $request, SiteHeadcountService $headcount, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'onSiteCount' => $headcount->onSiteCount($site),
            'permissions' => $data->permissions($request->user()),
            'analytics' => $iotAnalytics->rfidPageAnalytics($site->id),
        ]);
    }

    public function zones(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/zones', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'zones' => $data->zones(),
            'permissions' => $data->permissions($request->user()),
            ...$data->enumOptions(),
        ]);
    }

    public function workers(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/workers', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'workers' => $data->workers(),
            'permissions' => $data->permissions($request->user()),
            ...$data->enumOptions(),
        ]);
    }

    public function portableDevices(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/portable-devices', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'portableRegister' => $data->portableRegister(),
            'permissions' => $data->permissions($request->user()),
            ...$data->enumOptions(),
        ]);
    }

    public function personnel(Request $request, SiteHeadcountService $headcount): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/personnel', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'onSiteCount' => $headcount->onSiteCount($site),
            'onSitePersonnel' => $data->onSitePersonnel(),
        ]);
    }

    public function gateLog(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/gate-log', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'gateLog' => $data->gateLog(),
        ]);
    }

    public function evacuations(Request $request): Response
    {
        $site = $this->selectedSite($request);
        $data = new RfidSiteData($site);

        return Inertia::render('iot/rfid/evacuations', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'evacuationReports' => $data->evacuationReports(),
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
