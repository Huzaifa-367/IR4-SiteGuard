<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\Zone;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class CameraZoneController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:zones.manage'),
        ];
    }

    public function index(Camera $camera): Response
    {
        $camera->load(['site:id,name', 'detectionModule:id,name']);

        return Inertia::render('cameras/zones', [
            'camera' => [
                'id' => $camera->id,
                'name' => $camera->name,
                'site_id' => $camera->site_id,
                'site_name' => $camera->site?->name,
                'module' => $camera->detectionModule?->name,
            ],
            'zones' => $camera->zones()
                ->with('rules:id,name,code')
                ->orderBy('name')
                ->get()
                ->map(fn (Zone $zone): array => [
                    'id' => $zone->id,
                    'name' => $zone->name,
                    'zone_type' => $zone->zone_type,
                    'is_active' => $zone->is_active,
                    'polygon' => $zone->polygon,
                    'rules' => $zone->rules->pluck('name')->all(),
                ]),
            'siteRules' => $camera->site?->rules()
                ->where('detection_module_id', $camera->detection_module_id)
                ->orderBy('code')
                ->get(['id', 'name', 'code']),
        ]);
    }

    public function store(Request $request, Camera $camera): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'zone_type' => ['nullable', 'string', 'max:64'],
            'polygon' => ['required', 'array', 'min:3'],
            'polygon.*.x' => ['required', 'numeric', 'between:0,1'],
            'polygon.*.y' => ['required', 'numeric', 'between:0,1'],
            'rule_ids' => ['nullable', 'array'],
            'rule_ids.*' => ['integer', 'exists:rules,id'],
        ]);

        $zone = $camera->zones()->create([
            'site_id' => $camera->site_id,
            'name' => $validated['name'],
            'zone_type' => $validated['zone_type'] ?? 'monitored',
            'polygon' => $validated['polygon'],
            'is_active' => true,
        ]);

        if (! empty($validated['rule_ids'])) {
            $zone->rules()->sync($validated['rule_ids']);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Zone created.')]);

        return to_route('cameras.zones.index', $camera);
    }

    public function destroy(Camera $camera, Zone $zone): RedirectResponse
    {
        abort_unless($zone->camera_id === $camera->id, 404);
        $zone->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Zone deleted.')]);

        return to_route('cameras.zones.index', $camera);
    }
}
