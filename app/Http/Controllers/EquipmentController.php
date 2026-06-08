<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreEquipmentAssetRequest;
use App\Http\Requests\StoreEquipmentDocumentRequest;
use App\Http\Requests\StoreEquipmentInspectionRequest;
use App\Http\Requests\StoreEquipmentMaintenanceRequest;
use App\Models\EquipmentAsset;
use App\Models\EquipmentDocument;
use App\Models\User;
use App\Services\Reports\UdpmWeeklyReportService;
use App\Support\IotAnalytics;
use App\Support\SiteGuardEnums;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class EquipmentController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:equipment.view', only: ['overview', 'assets', 'show', 'printLabel']),
            new Middleware('permission:equipment.manage', only: ['store', 'storeInspection', 'storeMaintenance', 'storeDocument']),
        ];
    }

    public function overview(Request $request, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);
        $assets = EquipmentAsset::query()->where('site_id', $site->id)->get();

        return Inertia::render('iot/equipment/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'summary' => [
                'total' => $assets->count(),
                'active' => $assets->where('status', 'active')->count(),
                'vehicles' => $assets->where('equipment_type', 'vehicle')->count(),
                'out_of_service' => $assets->where('status', 'out_of_service')->count(),
            ],
            'analytics' => $iotAnalytics->equipmentPageAnalytics($site->id),
        ]);
    }

    public function assets(Request $request): Response
    {
        $site = $this->selectedSite($request);

        $assets = EquipmentAsset::query()
            ->where('site_id', $site->id)
            ->withCount(['inspections', 'maintenanceRecords'])
            ->withMax('inspections', 'inspected_at')
            ->orderBy('equipment_id')
            ->get();

        return Inertia::render('iot/equipment/assets', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'assets' => $assets->map(fn (EquipmentAsset $asset): array => [
                'id' => $asset->id,
                'equipment_id' => $asset->equipment_id,
                'name' => $asset->name,
                'equipment_type' => $asset->equipment_type,
                'status' => $asset->status,
                'qr_slug' => $asset->qr_slug,
                'location_note' => $asset->location_note,
                'registered_at' => $asset->registered_at?->toIso8601String(),
                'inspections_count' => $asset->inspections_count,
                'maintenance_count' => $asset->maintenance_records_count,
                'last_inspection_at' => $asset->inspections_max_inspected_at,
            ]),
            'permissions' => [
                'canManage' => $request->user()?->can('equipment.manage') ?? false,
            ],
            'equipmentTypeOptions' => SiteGuardEnums::options('equipment_types'),
        ]);
    }

    public function show(Request $request, EquipmentAsset $asset): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $asset->site_id === (int) $site->id, 404);

        $asset->load([
            'inspections' => fn ($q) => $q->orderByDesc('inspected_at')->limit(20),
            'maintenanceRecords' => fn ($q) => $q->orderByDesc('performed_at')->limit(20),
            'documents' => fn ($q) => $q->orderByDesc('uploaded_at'),
        ]);

        $scanUrl = url('/equipment/'.$asset->qr_slug);

        return Inertia::render('iot/equipment-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'asset' => [
                'id' => $asset->id,
                'equipment_id' => $asset->equipment_id,
                'name' => $asset->name,
                'equipment_type' => $asset->equipment_type,
                'status' => $asset->status,
                'manufacturer' => $asset->manufacturer,
                'model' => $asset->model,
                'serial_number' => $asset->serial_number,
                'qr_slug' => $asset->qr_slug,
                'scan_url' => $scanUrl,
                'location_note' => $asset->location_note,
                'registered_at' => $asset->registered_at?->toIso8601String(),
            ],
            'inspections' => $asset->inspections->map(fn ($row): array => [
                'id' => $row->id,
                'inspected_at' => $row->inspected_at->toDateString(),
                'inspector_name' => $row->inspector_name,
                'outcome' => $row->outcome,
                'notes' => $row->notes,
                'next_inspection_due' => $row->next_inspection_due?->toDateString(),
            ]),
            'maintenance' => $asset->maintenanceRecords->map(fn ($row): array => [
                'id' => $row->id,
                'performed_at' => $row->performed_at->toDateString(),
                'maintenance_type' => $row->maintenance_type,
                'description' => $row->description,
                'performed_by' => $row->performed_by,
                'next_service_due' => $row->next_service_due?->toDateString(),
            ]),
            'documents' => $asset->documents->map(fn ($doc): array => [
                'id' => $doc->id,
                'document_type' => $doc->document_type,
                'title' => $doc->title,
                'external_url' => $doc->external_url,
                'uploaded_at' => $doc->uploaded_at->toDateString(),
            ]),
            'permissions' => [
                'canManage' => $request->user()?->can('equipment.manage') ?? false,
            ],
            'inspectionOutcomeOptions' => SiteGuardEnums::options('inspection_outcomes'),
            'maintenanceTypeOptions' => SiteGuardEnums::options('maintenance_types'),
            'documentTypeOptions' => SiteGuardEnums::options('document_types'),
            'users' => User::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(
        StoreEquipmentAssetRequest $request,
        UdpmWeeklyReportService $reports,
    ): RedirectResponse {
        $site = $this->selectedSite($request);

        $site->equipmentAssets()->create([
            ...$request->validated(),
            'qr_slug' => $reports->generateQrSlug(),
            'status' => 'active',
            'registered_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Equipment registered.'),
        ]);

        return to_route('iot.equipment.assets.index');
    }

    public function storeInspection(
        StoreEquipmentInspectionRequest $request,
        EquipmentAsset $asset,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $asset->site_id === (int) $site->id, 404);

        $asset->inspections()->create([
            ...$request->validated(),
            'created_by_user_id' => $request->user()?->id,
        ]);

        return $this->assetRedirect($asset, __('Inspection recorded.'));
    }

    public function storeDocument(
        StoreEquipmentDocumentRequest $request,
        EquipmentAsset $asset,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $asset->site_id === (int) $site->id, 404);

        $storageKey = null;

        if ($request->hasFile('file')) {
            $storageKey = $request->file('file')->store(
                'sites/'.$site->id.'/equipment/'.$asset->id,
                'local',
            );
        }

        EquipmentDocument::query()->create([
            'equipment_asset_id' => $asset->id,
            'document_type' => $request->validated('document_type'),
            'title' => $request->validated('title'),
            'storage_key' => $storageKey,
            'external_url' => $request->validated('external_url'),
            'uploaded_at' => now(),
        ]);

        return $this->assetRedirect($asset, __('Document uploaded.'));
    }

    public function storeMaintenance(
        StoreEquipmentMaintenanceRequest $request,
        EquipmentAsset $asset,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $asset->site_id === (int) $site->id, 404);

        $asset->maintenanceRecords()->create($request->validated());

        return $this->assetRedirect($asset, __('Maintenance record saved.'));
    }

    public function printLabel(Request $request, EquipmentAsset $asset): HttpResponse
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $asset->site_id === (int) $site->id, 404);

        $scanUrl = url('/equipment/'.$asset->qr_slug);
        $zpl = "^XA\n^FO50,50^BQN,2,6^FDQA,{$scanUrl}^FS\n^FO50,280^A0N,30,30^FD{$asset->equipment_id}^FS\n^FO50,320^A0N,24,24^FD{$asset->name}^FS\n^XZ";

        return response($zpl, 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="'.$asset->equipment_id.'-label.zpl"',
        ]);
    }

    private function assetRedirect(EquipmentAsset $asset, string $message): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('iot.equipment.show', $asset);
    }
}
