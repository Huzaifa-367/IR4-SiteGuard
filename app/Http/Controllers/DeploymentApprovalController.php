<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreDeploymentApprovalRequest;
use App\Models\DeploymentApproval;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class DeploymentApprovalController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:settings.manage', only: ['index', 'show', 'store', 'approve']),
        ];
    }

    public function index(Request $request): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('iot/deployment-approvals', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'approvals' => DeploymentApproval::query()
                ->where('site_id', $site->id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (DeploymentApproval $row): array => [
                    'id' => $row->id,
                    'approval_type' => $row->approval_type,
                    'status' => $row->status,
                    'submitted_at' => $row->submitted_at?->toIso8601String(),
                    'approved_at' => $row->approved_at?->toIso8601String(),
                    'notes' => $row->notes,
                ]),
            'commissioning_gate' => $site->settings['commissioning_gate'] ?? 'pending',
            'approval_types' => collect(config('siteguard.deployment_approval_types', []))
                ->map(fn (string $label, string $value): array => ['value' => $value, 'label' => $label])
                ->values()
                ->all(),
        ]);
    }

    public function show(Request $request, DeploymentApproval $approval): Response
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $approval->site_id === (int) $site->id, 404);

        $approval->load(['submittedBy:id,name', 'approvedBy:id,name']);

        $typeLabel = config('siteguard.deployment_approval_types.'.$approval->approval_type)
            ?? $approval->approval_type;

        return Inertia::render('iot/deployment-approval-show', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'approval' => [
                'id' => $approval->id,
                'approval_type' => $approval->approval_type,
                'approval_type_label' => $typeLabel,
                'status' => $approval->status,
                'submitted_at' => $approval->submitted_at?->toIso8601String(),
                'approved_at' => $approval->approved_at?->toIso8601String(),
                'notes' => $approval->notes,
                'has_document' => $approval->document_storage_key !== null,
            ],
            'submittedBy' => $approval->submittedBy ? ['name' => $approval->submittedBy->name] : null,
            'approvedBy' => $approval->approvedBy ? ['name' => $approval->approvedBy->name] : null,
            'commissioning_gate' => $site->settings['commissioning_gate'] ?? 'pending',
            'permissions' => [
                'canApprove' => $request->user()?->can('settings.manage') ?? false,
            ],
        ]);
    }

    public function store(StoreDeploymentApprovalRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $validated = $request->validated();

        $storageKey = null;

        if ($request->hasFile('document')) {
            $storageKey = $request->file('document')->store(
                'sites/'.$site->id.'/deployment-approvals',
                'local',
            );
        }

        $approval = DeploymentApproval::query()->create([
            'site_id' => $site->id,
            'approval_type' => $validated['approval_type'],
            'status' => 'submitted',
            'submitted_at' => now(),
            'submitted_by_user_id' => $request->user()?->id,
            'document_storage_key' => $storageKey,
            'notes' => $validated['notes'] ?? null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Deployment approval submitted.'),
        ]);

        return to_route('iot.deployment-approvals.show', $approval);
    }

    public function approve(Request $request, DeploymentApproval $approval): RedirectResponse
    {
        $site = $this->selectedSite($request);
        abort_unless((int) $approval->site_id === (int) $site->id, 404);

        $approval->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by_user_id' => $request->user()?->id,
        ]);

        if ($approval->approval_type === config('siteguard_enums.commissioning_approval_type', 'cctv_gi')) {
            $settings = $site->settings ?? [];
            $settings['commissioning_gate'] = 'approved';
            $site->update(['settings' => $settings]);
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Deployment approval recorded.'),
        ]);

        return to_route('iot.deployment-approvals.show', $approval);
    }
}
