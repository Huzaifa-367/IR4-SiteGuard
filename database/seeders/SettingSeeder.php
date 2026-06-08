<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'retention_days' => 90,
            'default_confidence_min' => 0.75,
            'ai_enabled' => true,
            'ai_model' => 'gpt-4o-mini',
            'ai_max_messages_per_hour_user' => 60,
            'mail_from_address' => 'alerts@siteguard.local',
        ];

        foreach ($settings as $key => $value) {
            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value],
            );
        }
    }
}
