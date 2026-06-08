<?php

namespace App\Http\Controllers;

use App\Models\EquipmentAsset;
use App\Models\EquipmentQrScan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentScanController extends Controller
{
    public function show(Request $request, string $qrSlug): Response
    {
        $asset = EquipmentAsset::query()
            ->where('qr_slug', $qrSlug)
            ->with([
                'site:id,name,code',
                'inspections' => fn ($q) => $q->orderByDesc('inspected_at')->limit(5),
                'maintenanceRecords' => fn ($q) => $q->orderByDesc('performed_at')->limit(5),
                'documents' => fn ($q) => $q->orderByDesc('uploaded_at')->limit(10),
            ])
            ->firstOrFail();

        EquipmentQrScan::query()->create([
            'equipment_asset_id' => $asset->id,
            'scanned_at' => now(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return Inertia::render('equipment/scan', [
            'asset' => [
                'equipment_id' => $asset->equipment_id,
                'name' => $asset->name,
                'equipment_type' => $asset->equipment_type,
                'status' => $asset->status,
                'manufacturer' => $asset->manufacturer,
                'model' => $asset->model,
                'serial_number' => $asset->serial_number,
                'location_note' => $asset->location_note,
                'registered_at' => $asset->registered_at?->toIso8601String(),
            ],
            'site' => [
                'name' => $asset->site->name,
                'code' => $asset->site->code,
            ],
            'inspections' => $asset->inspections->map(fn ($row): array => [
                'inspected_at' => $row->inspected_at->toDateString(),
                'inspector_name' => $row->inspector_name,
                'outcome' => $row->outcome,
            ]),
            'maintenance' => $asset->maintenanceRecords->map(fn ($row): array => [
                'performed_at' => $row->performed_at->toDateString(),
                'maintenance_type' => $row->maintenance_type,
                'description' => $row->description,
                'next_service_due' => $row->next_service_due?->toDateString(),
            ]),
            'documents' => $asset->documents->map(fn ($doc): array => [
                'title' => $doc->title,
                'document_type' => $doc->document_type,
                'external_url' => $doc->external_url,
            ]),
            'next_inspection_due' => $asset->inspections->first()?->next_inspection_due?->toDateString(),
            'next_service_due' => $asset->maintenanceRecords->first()?->next_service_due?->toDateString(),
        ]);
    }
}
