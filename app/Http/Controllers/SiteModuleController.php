<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\UsesSelectedSite;
use App\Models\DetectionModule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class SiteModuleController extends Controller implements HasMiddleware
{
    use UsesSelectedSite;

    public static function middleware(): array
    {
        return [
            new Middleware('permission:modules.view', only: ['index']),
            new Middleware('permission:modules.configure', only: ['update']),
        ];
    }

    public function index(Request $request): Response
    {
        $site = $this->selectedSite($request);

        $catalog = DetectionModule::query()->orderBy('name')->get();
        $enabled = $site->detectionModules()->get()->keyBy('id');

        return Inertia::render('modules/index', [
            'site' => ['id' => $site->id, 'name' => $site->name, 'code' => $site->code],
            'modules' => $catalog->map(fn (DetectionModule $module): array => [
                'id' => $module->id,
                'key' => $module->key,
                'name' => $module->name,
                'description' => $module->description,
                'is_enabled' => (bool) ($enabled->get($module->id)?->pivot->is_enabled ?? false),
                'settings' => $enabled->get($module->id)?->pivot->settings,
            ]),
            'canConfigure' => $request->user()?->can('modules.configure') ?? false,
        ]);
    }

    public function update(Request $request, DetectionModule $module): RedirectResponse
    {
        $site = $this->selectedSite($request);

        $validated = $request->validate([
            'is_enabled' => ['required', 'boolean'],
            'settings' => ['nullable', 'array'],
        ]);

        $site->detectionModules()->syncWithoutDetaching([
            $module->id => [
                'is_enabled' => $validated['is_enabled'],
                'settings' => isset($validated['settings'])
                    ? json_encode($validated['settings'])
                    : null,
            ],
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Module settings saved.'),
        ]);

        return to_route('modules.index');
    }
}
