<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            DetectionModuleSeeder::class,
            SettingSeeder::class,
            DemoUserSeeder::class,
            SiteGuardFullDemoSeeder::class,
            IotLifecycleDemoSeeder::class,
        ]);
    }
}
