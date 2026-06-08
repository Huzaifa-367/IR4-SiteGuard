import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AllAccountsTable from '@/components/all-accounts-table';
import Heading from '@/components/heading';
import RoleCard from '@/components/role-card';
import RoleFormDialog from '@/components/role-form-dialog';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import { index } from '@/routes/roles';
import type {
    PermissionGroup,
    Role,
    RoleSummary,
    UserWithRoles,
} from '@/types/permission';

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type RolesIndexProps = {
    roles: Role[];
    permissionGroups: PermissionGroup[];
    systemRoles: string[];
    users: Paginator<UserWithRoles> | null;
    assignableRoles: RoleSummary[];
    filters: { search: string; role: string };
    permissionsFlags: { canViewUsers: boolean; canAssignRoles: boolean };
};

type DialogState =
    | { mode: 'closed' }
    | { mode: 'create' }
    | { mode: 'edit'; role: Role };

export default function RolesIndex({
    roles,
    permissionGroups,
    users,
    assignableRoles,
    filters,
    permissionsFlags,
}: RolesIndexProps) {
    const { can } = usePermissions();
    const canManage = can('roles.manage');
    const canCreate = canManage;
    const canUpdate = canManage;
    const canDelete = canManage;

    const [dialog, setDialog] = useState<DialogState>(() =>
        resolveInitialDialog(roles, { canCreate, canUpdate }),
    );

    const openCreate = (): void => setDialog({ mode: 'create' });
    const openEdit = (role: Role): void => setDialog({ mode: 'edit', role });
    const close = (open: boolean): void => {
        if (!open) {
            setDialog({ mode: 'closed' });
        }
    };

    return (
        <>
            <Head title="Roles & permissions" />

            <h1 className="sr-only">Roles & permissions</h1>

            <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <Heading
                        title="Roles & Permissions"
                        description="Define what each role can do and assign roles to the people in your workspace."
                    />

                    {canCreate && (
                        <Button
                            onClick={openCreate}
                            data-test="create-role-button"
                        >
                            <Plus className="size-4" />
                            Create role
                        </Button>
                    )}
                </div>

                {roles.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No roles yet.
                        {canCreate && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="ml-1 font-medium text-foreground underline underline-offset-4"
                            >
                                Create your first role
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {roles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                canEdit={canUpdate}
                                onEdit={openEdit}
                            />
                        ))}
                    </div>
                )}

                {permissionsFlags.canViewUsers && users && (
                    <section className="space-y-4">
                        <Heading
                            title="All accounts"
                            description="Assign a role to every person who collaborates in this workspace."
                        />

                        <AllAccountsTable
                            users={users}
                            roles={assignableRoles}
                            filters={filters}
                            canAssignRoles={permissionsFlags.canAssignRoles}
                        />
                    </section>
                )}
            </div>

            <RoleFormDialog
                open={dialog.mode !== 'closed'}
                onOpenChange={close}
                permissionGroups={permissionGroups}
                role={dialog.mode === 'edit' ? dialog.role : null}
                canDelete={canDelete}
            />
        </>
    );
}

/**
 * Reads `?action=create` / `?edit=<id>` from the URL once, on first paint,
 * so links into the create or edit dialog open it immediately.
 *
 * Cleans up the URL afterwards so a refresh does not reopen the dialog.
 */
function resolveInitialDialog(
    roles: Role[],
    { canCreate, canUpdate }: { canCreate: boolean; canUpdate: boolean },
): DialogState {
    if (typeof window === 'undefined') {
        return { mode: 'closed' };
    }

    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const editId = params.get('edit');

    const clearQueryString = (): void => {
        params.delete('action');
        params.delete('edit');
        const query = params.toString();
        const next =
            query === ''
                ? window.location.pathname
                : `${window.location.pathname}?${query}`;
        window.history.replaceState({}, '', next);
    };

    if (action === 'create' && canCreate) {
        clearQueryString();

        return { mode: 'create' };
    }

    if (editId !== null && canUpdate) {
        const role = roles.find((r) => String(r.id) === editId);

        if (role !== undefined) {
            clearQueryString();

            return { mode: 'edit', role };
        }
    }

    return { mode: 'closed' };
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles & permissions',
            href: index(),
        },
    ],
};
