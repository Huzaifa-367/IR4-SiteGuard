import { usePage } from '@inertiajs/react';

type PermissionHelpers = {
    permissions: string[];
    roles: string[];
    can: (permission: string) => boolean;
    canAny: (...permissions: string[]) => boolean;
    hasRole: (role: string) => boolean;
};

export function usePermissions(): PermissionHelpers {
    const { auth } = usePage().props;
    const permissions = auth?.permissions ?? [];
    const roles = auth?.roles ?? [];

    return {
        permissions,
        roles,
        can: (permission: string): boolean => permissions.includes(permission),
        canAny: (...candidates: string[]): boolean =>
            candidates.some((candidate) => permissions.includes(candidate)),
        hasRole: (role: string): boolean => roles.includes(role),
    };
}
