<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreLsrViolationRequest;
use App\Http\Requests\StoreVehicleViolationRequest;
use App\Http\Requests\UpdateLsrViolationActionsRequest;
use App\Models\EquipmentAsset;
use App\Models\LsrViolationLog;
use App\Models\VehicleViolationLog;
use App\Models\WorkerRecord;
use App\Support\Iot\IotTimeRange;
use App\Support\IotAnalytics;
use App\Support\SiteGuardEnums;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class LsrViolationController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:lsr.view', only: ['overview', 'violations', 'show']),
            new Middleware('permission:lsr.view|vehicle_violations.log', only: ['vehicleViolations', 'showVehicleViolation']),
            new Middleware('permission:lsr.log_manual', only: ['store']),
            new Middleware('permission:lsr.actions_update', only: ['updateActions']),
            new Middleware('permission:vehicle_violations.log', only: ['storeVehicle']),
        ];
    }

    public function overview(Request $request, IotAnalytics $iotAnalytics): Response
    {
        $site = $this->selectedSite($request);

        $selectedDays = IotTimeRange::chartDaysFromRequest($request);
        $chartDays = IotTimeRange::effectiveChartDays($selectedDays);

        return Inertia::render('iot/lsr/overview', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'summary' => $this->summary($site, $selectedDays),
            'categoryBreakdown' => $this->categoryBreakdown($site, $selectedDays),
            'automatedCategories' => SiteGuardEnums::lsrAutomatedCategories(),
            'analytics' => $iotAnalytics->lsrPageAnalytics($site->id, $chartDays),
            'filters' => IotTimeRange::chartFilters($request),
        ]);
    }

    public function violations(Request $request): Response
    {
        $site = $this->selectedSite($request);

        $listDays = IotTimeRange::listDaysFromRequest($request);

        return Inertia::render('iot/lsr/violations', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'violations' => $this->violationsList($site, $listDays, $request),
            'filters' => IotTimeRange::listFilters($request),
            'lsrCategories' => SiteGuardEnums::lsrManualCategories(),
            'lsrCategoryOptions' => collect(SiteGuardEnums::lsrManualCategories())
                ->map(fn (string $label, string $code): array => ['value' => $code, 'label' => $label])
                ->values()
                ->all(),
            'permissions' => [
                'canLogManual' => $request->user()?->can('lsr.log_manual') ?? false,
                'canUpdateActions' => $request->user()?->can('lsr.actions_update') ?? false,
            ],
        ]);
    }

    public function vehicleViolations(Request $request): Response
    {
        $site = $this->selectedSite($request);

        $listDays = IotTimeRange::listDaysFromRequest($request);

        $vehicleQuery = VehicleViolationLog::query()
            ->where('site_id', $site->id)
            ->orderByDesc('occurred_at');

        IotTimeRange::applySince($vehicleQuery, 'occurred_at', $listDays);

        $vehicleViolations = $vehicleQuery
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (VehicleViolationLog $log): array => [
                'id' => $log->id,
                'vehicle_description' => $log->vehicle_description,
                'violation_type' => $log->violation_type,
                'description' => $log->description,
                'actions_taken' => $log->actions_taken,
                'occurred_at' => $log->occurred_at->toIso8601String(),
            ]);

        return Inertia::render('iot/lsr/vehicle-violations', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'vehicleViolations' => $vehicleViolations,
            'filters' => IotTimeRange::listFilters($request),
            'vehicleViolationTypes' => SiteGuardEnums::options('vehicle_violation_types'),
            'vehicleAssets' => EquipmentAsset::query()
                ->where('site_id', $site->id)
                ->where('equipment_type', 'vehicle')
                ->orderBy('name')
                ->get(['id', 'name', 'equipment_id'])
                ->map(fn (EquipmentAsset $asset): array => [
                    'id' => $asset->id,
                    'label' => "{$asset->equipment_id} — {$asset->name}",
                ]),
            'permissions' => [
                'canLogVehicle' => $request->user()?->can('vehicle_violations.log') ?? false,
            ],
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function summary($site, int $selectedDays = 90): array
    {
        $violationQuery = LsrViolationLog::query()->where('site_id', $site->id);
        IotTimeRange::applySince($violationQuery, 'occurred_at', $selectedDays);

        $vehicleQuery = VehicleViolationLog::query()->where('site_id', $site->id);
        IotTimeRange::applySince($vehicleQuery, 'occurred_at', $selectedDays);

        return [
            'total' => (clone $violationQuery)->count(),
            'automated' => (clone $violationQuery)->where('detection_mode', 'automated')->count(),
            'manual' => (clone $violationQuery)->where('detection_mode', 'manual')->count(),
            'missing_actions' => (clone $violationQuery)->whereNull('actions_taken')->count(),
            'vehicle_violations' => $vehicleQuery->count(),
        ];
    }

    /**
     * @return list<array{category: string, count: int}>
     */
    private function categoryBreakdown($site, int $selectedDays = 90): array
    {
        $query = LsrViolationLog::query()->where('site_id', $site->id);
        IotTimeRange::applySince($query, 'occurred_at', $selectedDays);

        return $query
            ->selectRaw('lsr_category, count(*) as total')
            ->groupBy('lsr_category')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'category' => $row->lsr_category,
                'count' => (int) $row->total,
            ])
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function violationsList($site, int $listDays, Request $request): LengthAwarePaginator
    {
        $query = LsrViolationLog::query()
            ->where('site_id', $site->id)
            ->orderByDesc('occurred_at');

        IotTimeRange::applySince($query, 'occurred_at', $listDays);

        return $query
            ->paginate(IotTimeRange::perPage())
            ->withQueryString()
            ->through(fn (LsrViolationLog $log): array => [
                'id' => $log->id,
                'lsr_category' => $log->lsr_category,
                'detection_mode' => $log->detection_mode,
                'description' => $log->description,
                'actions_taken' => $log->actions_taken,
                'occurred_at' => $log->occurred_at->toIso8601String(),
                'alert_id' => $log->alert_id,
            ]);
    }

    public function showVehicleViolation(Request $request, VehicleViolationLog $vehicleViolation): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $vehicleViolation->site_id === (int) $site->id, 404);

        $vehicleViolation->load([
            'equipmentAsset:id,name,equipment_id,equipment_type',
            'loggedBy:id,name',
            'camera:id,name',
        ]);

        $typeOption = collect(SiteGuardEnums::options('vehicle_violation_types'))
            ->firstWhere('value', $vehicleViolation->violation_type);
        $typeLabel = $typeOption['label'] ?? $vehicleViolation->violation_type;

        return Inertia::render('iot/vehicle-violation-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'violation' => [
                'id' => $vehicleViolation->id,
                'vehicle_description' => $vehicleViolation->vehicle_description,
                'violation_type' => $vehicleViolation->violation_type,
                'violation_type_label' => $typeLabel,
                'description' => $vehicleViolation->description,
                'actions_taken' => $vehicleViolation->actions_taken,
                'occurred_at' => $vehicleViolation->occurred_at->toIso8601String(),
            ],
            'equipmentAsset' => $vehicleViolation->equipmentAsset ? [
                'id' => $vehicleViolation->equipmentAsset->id,
                'name' => $vehicleViolation->equipmentAsset->name,
                'equipment_id' => $vehicleViolation->equipmentAsset->equipment_id,
                'equipment_type' => $vehicleViolation->equipmentAsset->equipment_type,
            ] : null,
            'camera' => $vehicleViolation->camera ? [
                'id' => $vehicleViolation->camera->id,
                'name' => $vehicleViolation->camera->name,
            ] : null,
            'loggedBy' => $vehicleViolation->loggedBy ? ['name' => $vehicleViolation->loggedBy->name] : null,
        ]);
    }

    public function show(Request $request, LsrViolationLog $violation): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $violation->site_id === (int) $site->id, 404);

        $violation->load(['alert:id,title,severity,status,opened_at', 'camera:id,name', 'rfidZone:id,name,code', 'loggedBy:id,name']);

        $workers = collect($violation->worker_record_ids ?? [])
            ->map(fn ($id) => WorkerRecord::query()->find($id))
            ->filter()
            ->map(fn (WorkerRecord $worker): array => [
                'id' => $worker->id,
                'full_name' => $worker->full_name,
                'contractor' => $worker->contractor,
                'role' => $worker->role,
            ])
            ->values()
            ->all();

        $categoryLabel = config('siteguard_enums.lsr_categories.'.$violation->lsr_category.'.label')
            ?? $violation->lsr_category;

        return Inertia::render('iot/lsr-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'violation' => [
                'id' => $violation->id,
                'lsr_category' => $violation->lsr_category,
                'category_label' => $categoryLabel,
                'detection_mode' => $violation->detection_mode,
                'description' => $violation->description,
                'actions_taken' => $violation->actions_taken,
                'occurred_at' => $violation->occurred_at->toIso8601String(),
            ],
            'alert' => $violation->alert ? [
                'id' => $violation->alert->id,
                'title' => $violation->alert->title,
                'severity' => $violation->alert->severity,
                'status' => $violation->alert->status,
                'opened_at' => $violation->alert->opened_at?->toIso8601String(),
            ] : null,
            'camera' => $violation->camera ? [
                'id' => $violation->camera->id,
                'name' => $violation->camera->name,
            ] : null,
            'rfidZone' => $violation->rfidZone ? [
                'id' => $violation->rfidZone->id,
                'name' => $violation->rfidZone->name,
                'code' => $violation->rfidZone->code,
            ] : null,
            'workers' => $workers,
            'loggedBy' => $violation->loggedBy ? ['name' => $violation->loggedBy->name] : null,
            'permissions' => [
                'canUpdateActions' => $request->user()?->can('lsr.actions_update') ?? false,
            ],
        ]);
    }

    public function store(StoreLsrViolationRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);

        $site->lsrViolationLogs()->create([
            ...$request->validated(),
            'detection_mode' => 'manual',
            'logged_by_user_id' => $request->user()?->id,
        ]);

        return $this->redirect(__('LSR violation logged.'), 'iot.lsr.violations.index');
    }

    public function updateActions(
        UpdateLsrViolationActionsRequest $request,
        LsrViolationLog $violation,
    ): RedirectResponse {
        $site = $this->selectedSite($request);
        abort_unless((int) $violation->site_id === (int) $site->id, 404);

        $violation->update($request->validated());

        return $this->redirect(__('Actions updated.'), 'iot.lsr.show', $violation);
    }

    public function storeVehicle(StoreVehicleViolationRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);

        $site->vehicleViolationLogs()->create([
            ...$request->validated(),
            'logged_by_user_id' => $request->user()?->id,
        ]);

        return $this->redirect(__('Vehicle violation logged.'), 'iot.lsr.vehicle-violations.index');
    }

    private function redirect(string $message, string $route = 'iot.lsr.violations.index', mixed $parameter = null): RedirectResponse
    {
        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return $parameter !== null ? to_route($route, $parameter) : to_route($route);
    }
}
