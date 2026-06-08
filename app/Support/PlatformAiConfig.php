<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class PlatformAiConfig
{
    public const string API_KEY_SETTING = 'openai_api_key';

    public const string MODEL_SETTING = 'ai_model';

    public static function apply(): void
    {
        $key = static::apiKey();

        if ($key !== null && $key !== '') {
            config(['ai.providers.openai.key' => $key]);
        }
    }

    public static function isConfigured(): bool
    {
        $key = static::apiKey();

        return is_string($key) && $key !== '';
    }

    public static function apiKey(): ?string
    {
        $stored = Setting::query()->where('key', static::API_KEY_SETTING)->value('value');

        if ($stored === null || $stored === '') {
            return env('OPENAI_API_KEY') ?: null;
        }

        if (! is_string($stored)) {
            return null;
        }

        try {
            return Crypt::decryptString($stored);
        } catch (DecryptException) {
            return null;
        }
    }

    public static function storeApiKey(?string $plain): void
    {
        if ($plain === null || $plain === '') {
            return;
        }

        Setting::query()->updateOrCreate(
            ['key' => static::API_KEY_SETTING],
            ['value' => Crypt::encryptString($plain)],
        );
    }

    public static function maskedApiKey(): ?string
    {
        $key = static::apiKey();

        if ($key === null || $key === '') {
            return null;
        }

        if (strlen($key) <= 8) {
            return '••••••••';
        }

        return substr($key, 0, 3).'…'.substr($key, -4);
    }

    public static function model(): string
    {
        $model = Setting::getValue(static::MODEL_SETTING, 'gpt-4o-mini');

        return is_string($model) && $model !== '' ? $model : 'gpt-4o-mini';
    }
}
