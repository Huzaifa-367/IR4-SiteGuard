<?php

namespace App\Http\Controllers;

use App\Models\NotificationChannel;
use App\Models\Setting;
use App\Support\PlatformAiConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:settings.manage'),
        ];
    }

    public function index(): Response
    {
        return Inertia::render('settings/platform', [
            'settings' => [
                'retention_days' => Setting::getValue('retention_days', 90),
                'default_confidence_min' => Setting::getValue('default_confidence_min', 0.75),
                'ai_enabled' => Setting::getValue('ai_enabled', true),
                'ai_max_messages_per_hour_user' => Setting::getValue('ai_max_messages_per_hour_user', 60),
                'ai_model' => PlatformAiConfig::model(),
                'has_openai_api_key' => PlatformAiConfig::isConfigured(),
                'openai_api_key_masked' => PlatformAiConfig::maskedApiKey(),
                'mail_from_address' => Setting::getValue('mail_from_address', ''),
            ],
            'notificationChannels' => NotificationChannel::query()
                ->with('site:id,name')
                ->orderBy('id')
                ->get()
                ->map(fn (NotificationChannel $channel): array => [
                    'id' => $channel->id,
                    'site' => $channel->site?->name ?? 'Global',
                    'type' => $channel->type,
                    'min_severity' => $channel->min_severity,
                    'is_active' => $channel->is_active,
                ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'retention_days' => ['required', 'integer', 'min:1', 'max:3650'],
            'default_confidence_min' => ['required', 'numeric', 'between:0,1'],
            'ai_enabled' => ['required', 'boolean'],
            'ai_max_messages_per_hour_user' => ['required', 'integer', 'min:1', 'max:1000'],
            'ai_model' => ['nullable', 'string', 'max:100'],
            'openai_api_key' => ['nullable', 'string', 'max:512'],
            'mail_from_address' => ['nullable', 'email'],
        ]);

        if (! empty($validated['openai_api_key'])) {
            PlatformAiConfig::storeApiKey($validated['openai_api_key']);
        }

        unset($validated['openai_api_key']);

        foreach ($validated as $key => $value) {
            Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings saved.')]);

        return to_route('settings.platform.index');
    }
}
