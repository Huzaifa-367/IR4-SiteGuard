<?php

namespace App\Support;

/**
 * Canonical SiteGuard permission registry — single source of truth for
 * seeders and the roles permission matrix UI.
 */
class PermissionRegistry
{
    /**
     * @return array<string, array{label: string, description: string, permissions: array<string, string>}>
     */
    public static function groups(): array
    {
        return [
            'sites' => [
                'label' => 'Sites',
                'description' => 'Construction sites and global site access.',
                'permissions' => [
                    'sites.view' => 'View sites',
                    'sites.create' => 'Create sites',
                    'sites.update' => 'Update sites',
                    'sites.delete' => 'Archive or delete sites',
                    'sites.access_all' => 'Access every site without assignment',
                ],
            ],
            'locations' => [
                'label' => 'Locations',
                'description' => 'Site location tree (zones on map).',
                'permissions' => [
                    'locations.manage' => 'Manage site locations',
                ],
            ],
            'modules' => [
                'label' => 'Detection modules',
                'description' => 'Enable and configure detection modules per site.',
                'permissions' => [
                    'modules.view' => 'View enabled modules',
                    'modules.configure' => 'Enable or configure modules',
                ],
            ],
            'cameras' => [
                'label' => 'Cameras',
                'description' => 'Camera registry, RTSP, and ingest tokens.',
                'permissions' => [
                    'cameras.view' => 'View cameras',
                    'cameras.create' => 'Create cameras',
                    'cameras.update' => 'Update cameras',
                    'cameras.delete' => 'Delete cameras',
                ],
            ],
            'zones' => [
                'label' => 'Zones & rules',
                'description' => 'Detection zones and safety rules.',
                'permissions' => [
                    'zones.manage' => 'Draw and edit zones',
                    'rules.view' => 'View rules',
                    'rules.manage' => 'Create and edit rules',
                ],
            ],
            'alerts' => [
                'label' => 'Alerts',
                'description' => 'Safety alert inbox and actions.',
                'permissions' => [
                    'alerts.view' => 'View alerts',
                    'alerts.acknowledge' => 'Acknowledge alerts',
                    'alerts.dismiss' => 'Dismiss or mark false positive',
                    'alerts.assign' => 'Assign alerts to users',
                ],
            ],
            'investigations' => [
                'label' => 'Investigations',
                'description' => 'Formal incident investigations.',
                'permissions' => [
                    'investigations.manage' => 'Manage investigations',
                ],
            ],
            'ai' => [
                'label' => 'AI assistant',
                'description' => 'Site safety AI chat and audit.',
                'permissions' => [
                    'ai.assistant.use' => 'Use the AI assistant',
                    'ai.assistant.admin' => 'View AI audit logs and admin settings',
                ],
            ],
            'users' => [
                'label' => 'Users',
                'description' => 'User accounts, roles, and site assignments.',
                'permissions' => [
                    'users.view' => 'View users',
                    'users.manage' => 'Manage users, roles, and site assignments',
                ],
            ],
            'roles' => [
                'label' => 'Roles',
                'description' => 'Dynamic roles and permission matrix.',
                'permissions' => [
                    'roles.view' => 'View roles and permissions',
                    'roles.manage' => 'Create, edit, and delete dynamic roles',
                ],
            ],
            'reports' => [
                'label' => 'Reports',
                'description' => 'Compliance exports.',
                'permissions' => [
                    'reports.export' => 'Export reports',
                ],
            ],
            'integrations' => [
                'label' => 'Integrations',
                'description' => 'External provisioning and webhooks.',
                'permissions' => [
                    'api_tokens.manage' => 'Manage Python ingest tokens',
                    'integrations.manage' => 'Manage integration API keys',
                ],
            ],
            'settings' => [
                'label' => 'Settings',
                'description' => 'Global platform settings.',
                'permissions' => [
                    'settings.manage' => 'Manage global settings',
                ],
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function all(): array
    {
        return collect(self::groups())
            ->flatMap(fn (array $group): array => array_keys($group['permissions']))
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public static function forGroup(string $key): array
    {
        $groups = self::groups();

        if (! isset($groups[$key])) {
            return [];
        }

        return array_keys($groups[$key]['permissions']);
    }

    /**
     * @param  array<int, string>  $keys
     * @return array<int, string>
     */
    public static function forGroups(array $keys): array
    {
        return collect($keys)
            ->flatMap(fn (string $key): array => self::forGroup($key))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    public static function systemRoles(): array
    {
        return ['super_admin'];
    }
}
