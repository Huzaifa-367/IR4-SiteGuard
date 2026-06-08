<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public const PASSWORD = '12345678';

    public function run(): void
    {
        $hash = Hash::make(self::PASSWORD);

        $this->seed('SiteGuard Admin', 'admin@siteguard.test', 'super_admin', $hash);
        $this->seed('Hannah HSE', 'hse@siteguard.test', 'hse_manager', $hash);
        $this->seed('Sam Supervisor', 'supervisor@siteguard.test', 'site_supervisor', $hash);
        $this->seed('Vera Viewer', 'viewer@siteguard.test', 'viewer', $hash);
    }

    private function seed(string $name, string $email, string $role, string $hash): User
    {
        /** @var User $user */
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => $hash,
                'email_verified_at' => now(),
                'is_active' => true,
            ],
        );

        if (! $user->hasRole($role)) {
            $user->syncRoles([$role]);
        }

        return $user;
    }
}
