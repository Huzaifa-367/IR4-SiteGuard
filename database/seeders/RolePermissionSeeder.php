<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Support\PermissionRegistry;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->syncPermissions();
        $this->syncRoles();
    }

    private function syncPermissions(): void
    {
        foreach (PermissionRegistry::all() as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }

    private function syncRoles(): void
    {
        $all = PermissionRegistry::all();

        $superAdmin = Role::firstOrCreate(
            ['name' => 'super_admin', 'guard_name' => 'web'],
            [
                'description' => 'Fixed system role with full access.',
                'is_system' => true,
            ],
        );
        $superAdmin->syncPermissions($all);

        $this->upsertRole('hse_manager', 'HSE manager with site operations and alert handling.', array_merge(
            PermissionRegistry::forGroups(['sites', 'locations', 'modules', 'cameras', 'zones', 'alerts', 'investigations', 'ai', 'users', 'reports', 'rfid', 'gas_environmental', 'equipment', 'hse_lsr', 'udpm']),
            ['sites.access_all', 'alerts.acknowledge', 'alerts.dismiss', 'alerts.assign'],
        ));

        $this->upsertRole('site_supervisor', 'Supervisor for assigned sites.', array_merge(
            PermissionRegistry::forGroup('sites'),
            ['sites.view', 'sites.update'],
            PermissionRegistry::forGroups(['locations', 'modules', 'cameras', 'zones', 'alerts']),
            ['alerts.acknowledge', 'alerts.dismiss', 'alerts.assign', 'ai.assistant.use'],
        ));

        $this->upsertRole('viewer', 'Read-only safety dashboard access.', [
            'sites.view',
            'modules.view',
            'cameras.view',
            'rules.view',
            'alerts.view',
            'reports.export',
        ]);

        $this->upsertRole('scc_operator', 'SCC operator — live monitoring and alert response.', array_merge(
            PermissionRegistry::forGroups(['sites', 'modules', 'cameras', 'zones', 'alerts']),
            [
                'rfid.view',
                'gate_log.view',
                'workers.view',
                'portable_devices.manage',
                'gas.view',
                'environmental.view',
                'equipment.view',
                'hse_incidents.view',
                'lsr.view',
                'lsr.actions_update',
                'evacuation.generate',
                'alerts.acknowledge',
                'alerts.dismiss',
            ],
        ));

        $this->upsertRole('safety_manager', 'Safety manager — full SCC operations and UDPM approval.', array_merge(
            PermissionRegistry::forGroups(['sites', 'locations', 'modules', 'cameras', 'zones', 'alerts', 'investigations', 'rfid', 'gas_environmental', 'equipment', 'hse_lsr', 'udpm', 'reports']),
            ['sites.access_all'],
        ));

        $this->upsertRole('project_manager', 'Project manager — read-only summaries and UDPM view.', [
            'sites.view',
            'rfid.view',
            'gas.view',
            'environmental.view',
            'udpm.view',
            'reports.export',
        ]);

        $this->upsertRole('sa_representative', 'Saudi Aramco representative — read-only, audited access.', [
            'sites.view',
            'modules.view',
            'cameras.view',
            'rules.view',
            'alerts.view',
            'rfid.view',
            'workers.view',
            'gate_log.view',
            'gas.view',
            'environmental.view',
            'equipment.view',
            'hse_incidents.view',
            'lsr.view',
            'udpm.view',
        ]);

        $this->upsertRole('site_staff', 'Site staff — equipment QR scan only.', [
            'equipment.view',
        ]);
    }

    /**
     * @param  array<int, string>  $permissions
     */
    private function upsertRole(string $name, string $description, array $permissions): void
    {
        $role = Role::firstOrCreate(
            ['name' => $name, 'guard_name' => 'web'],
            ['description' => $description, 'is_system' => false],
        );

        $role->fill(['description' => $description, 'is_system' => false])->save();
        $role->syncPermissions($permissions);
    }
}
