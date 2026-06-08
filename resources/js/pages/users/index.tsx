import { Head } from '@inertiajs/react';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import UserFormDialog, { type UserFormValues } from '@/components/siteguard/user-form-dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { index as usersIndex } from '@/routes/users';

type UserRow = UserFormValues;

type PaginatedUsers = {
    data: UserRow[];
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    users: PaginatedUsers;
    sites: { id: number; name: string }[];
    roles: { id: number; name: string }[];
    canManage: boolean;
};

export default function UsersIndex({ users, sites, roles, canManage }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserFormValues | null>(null);

    const dialogOpen = createOpen || editingUser !== null;

    const handleDialogOpenChange = (open: boolean): void => {
        if (! open) {
            setCreateOpen(false);
            setEditingUser(null);
        }
    };

    return (
        <>
            <Head title="Users" />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Users"
                    description="Assign roles and site access"
                >
                    {canManage ? (
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-1 size-4" />
                            Add user
                        </Button>
                    ) : null}
                </ConceptPageHeader>
                <ConceptTableCard>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Sites</TableHead>
                                <TableHead>Status</TableHead>
                                {canManage ? <TableHead className="w-[1%]" /> : null}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.roles.join(', ') || '—'}</TableCell>
                                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                        {user.sites.length > 0 ? user.sites.join(', ') : 'All sites'}
                                    </TableCell>
                                    <TableCell>
                                        <ConceptStatusBadge
                                            tone={user.is_active ? 'success' : 'muted'}
                                        >
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </ConceptStatusBadge>
                                    </TableCell>
                                    {canManage ? (
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setEditingUser(user)}
                                            >
                                                <Pencil className="mr-1 size-3" />
                                                Edit
                                            </Button>
                                        </TableCell>
                                    ) : null}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
            {canManage ? (
                <UserFormDialog
                    open={dialogOpen}
                    onOpenChange={handleDialogOpenChange}
                    user={editingUser}
                    sites={sites}
                    roles={roles}
                />
            ) : null}
        </>
    );
}

UsersIndex.layout = () => ({
    breadcrumbs: [{ title: 'Users', href: usersIndex() }],
});
