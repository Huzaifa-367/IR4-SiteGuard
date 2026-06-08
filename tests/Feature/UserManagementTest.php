<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DemoUserSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->seed(DemoUserSeeder::class);
    }

    public function test_admin_can_create_user(): void
    {
        $admin = User::query()->where('email', 'admin@siteguard.test')->firstOrFail();

        $response = $this->actingAs($admin)->post(route('users.store'), [
            'name' => 'New Operator',
            'email' => 'operator@siteguard.test',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'is_active' => true,
            'role' => 'viewer',
            'site_ids' => [],
        ]);

        $response->assertRedirect(route('users.index'));

        $this->assertDatabaseHas('users', [
            'email' => 'operator@siteguard.test',
            'name' => 'New Operator',
        ]);
    }

    public function test_guest_cannot_create_user(): void
    {
        $this->post(route('users.store'), [
            'name' => 'Hacker',
            'email' => 'hack@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'is_active' => true,
            'role' => 'viewer',
        ])->assertRedirect(route('login'));
    }
}
