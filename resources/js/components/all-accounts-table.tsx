import { router } from '@inertiajs/react';
import { Pencil, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import UserRolesDialog from '@/components/user-roles-dialog';
import { useInitials } from '@/hooks/use-initials';
import { index as rolesIndex } from '@/routes/roles';
import type { RoleSummary, UserWithRoles } from '@/types/permission';

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type AllAccountsTableProps = {
    users: Paginator<UserWithRoles>;
    roles: RoleSummary[];
    filters: { search: string; role: string };
    canAssignRoles: boolean;
};

const ALL_ROLES = 'all';

export default function AllAccountsTable({
    users,
    roles,
    filters,
    canAssignRoles,
}: AllAccountsTableProps) {
    const getInitials = useInitials();

    const [search, setSearch] = useState<string>(filters.search ?? '');
    const [roleFilter, setRoleFilter] = useState<string>(
        filters.role !== '' ? filters.role : ALL_ROLES,
    );

    useEffect(() => {
        const handle = window.setTimeout(() => {
            const nextSearch = search.trim();
            const nextRole = roleFilter === ALL_ROLES ? '' : roleFilter;

            if (
                nextSearch === (filters.search ?? '') &&
                nextRole === (filters.role ?? '')
            ) {
                return;
            }

            const query: Record<string, string> = {};

            if (nextSearch !== '') {
                query.search = nextSearch;
            }

            if (nextRole !== '') {
                query.role = nextRole;
            }

            router.get(rolesIndex().url, query, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only: ['users', 'filters'],
            });
        }, 300);

        return () => window.clearTimeout(handle);
    }, [search, roleFilter, filters.search, filters.role]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name or email"
                        className="pl-9"
                        autoComplete="off"
                        data-test="user-roles-search"
                    />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger
                        className="w-full capitalize sm:w-48"
                        data-test="user-roles-filter"
                    >
                        <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL_ROLES}>All roles</SelectItem>
                        {roles.map((role) => (
                            <SelectItem
                                key={role.id}
                                value={role.name}
                                className="capitalize"
                            >
                                {role.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">
                                Name
                            </th>
                            <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">
                                Role
                            </th>
                            <th className="px-4 py-3 text-right font-medium">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={3}
                                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                                >
                                    No users match the current filters.
                                </td>
                            </tr>
                        )}

                        {users.data.map((user) => {
                            const role = user.roles[0];

                            return (
                                <tr key={user.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-9">
                                                <AvatarFallback>
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>

                                                {role && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="mt-1 capitalize sm:hidden"
                                                    >
                                                        {role.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="hidden px-4 py-3 sm:table-cell">
                                        {role ? (
                                            <Badge
                                                variant="secondary"
                                                className="capitalize"
                                            >
                                                {role.name}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                No role
                                            </Badge>
                                        )}
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                        {canAssignRoles && (
                                            <UserRolesDialog
                                                user={user}
                                                roles={roles}
                                                trigger={
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        data-test={`edit-user-role-${user.id}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                        <span className="hidden sm:inline">
                                                            Change role
                                                        </span>
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {users.last_page > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
                    <p>
                        Showing {users.from ?? 0}–{users.to ?? 0} of{' '}
                        {users.total}
                    </p>

                    <div className="flex flex-wrap gap-1">
                        {users.links.map((link, idx) => (
                            <Button
                                key={`${link.label}-${idx}`}
                                size="sm"
                                variant={link.active ? 'default' : 'ghost'}
                                disabled={link.url === null}
                                onClick={() => {
                                    if (link.url !== null) {
                                        router.get(
                                            link.url,
                                            {},
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        );
                                    }
                                }}
                            >
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
