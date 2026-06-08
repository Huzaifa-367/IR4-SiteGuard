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
        $this->seed('Omar Operator', 'scc_operator@siteguard.test', 'scc_operator', $hash);
        $this->seed('Sara Safety', 'safety_manager@siteguard.test', 'safety_manager', $hash);
        $this->seed('Eddie Equipment', 'site_staff@siteguard.test', 'site_staff', $hash);
        $this->seed('Paula Project', 'project_manager@siteguard.test', 'project_manager', $hash);
        $this->seed('Rita SA Rep', 'sa_representative@siteguard.test', 'sa_representative', $hash);
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
