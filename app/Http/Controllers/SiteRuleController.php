<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Http\Requests\StoreRuleRequest;
use App\Http\Requests\UpdateRuleRequest;
use App\Models\Rule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class SiteRuleController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:rules.view', only: ['index']),
            new Middleware('permission:rules.manage', only: ['store', 'update', 'destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $site = $this->selectedSite($request);

        return Inertia::render('rules/index', [
            'site' => ['id' => $site->id, 'name' => $site->name],
            'rules' => $site->rules()
                ->with('detectionModule:id,name,key')
                ->orderBy('code')
                ->get()
                ->map(fn (Rule $rule): array => [
                    'id' => $rule->id,
                    'code' => $rule->code,
                    'name' => $rule->name,
                    'severity' => $rule->severity,
                    'is_active' => $rule->is_active,
                    'detection_module_id' => $rule->detection_module_id,
                    'module' => $rule->detectionModule?->name,
                    'match_key' => is_string($rule->definition['match'] ?? null)
                        ? $rule->definition['match']
                        : '',
                    'dwell_sec' => $rule->dwell_sec,
                    'cooldown_sec' => $rule->cooldown_sec,
                ]),
            'modules' => $site->detectionModules()
                ->wherePivot('is_enabled', true)
                ->orderBy('name')
                ->get(['detection_modules.id', 'detection_modules.name']),
            'canManage' => $request->user()?->can('rules.manage') ?? false,
        ]);
    }

    public function store(StoreRuleRequest $request): RedirectResponse
    {
        $site = $this->selectedSite($request);
        $site->rules()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rule created.')]);

        return to_route('rules.index');
    }

    public function update(UpdateRuleRequest $request, Rule $rule): RedirectResponse
    {
        $site = $this->selectedSite($request);
        abort_unless($rule->site_id === $site->id, 404);
        $rule->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rule updated.')]);

        return to_route('rules.index');
    }

    public function destroy(Request $request, Rule $rule): RedirectResponse
    {
        $site = $this->selectedSite($request);
        abort_unless($rule->site_id === $site->id, 404);
        $rule->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Rule deleted.')]);

        return to_route('rules.index');
    }
}
