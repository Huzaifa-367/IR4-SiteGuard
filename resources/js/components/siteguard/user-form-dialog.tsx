import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store as storeUser, update as updateUser } from '@/routes/users';

export type UserFormValues = {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    roles: string[];
    sites: string[];
    site_ids: number[];
};

type UserFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: UserFormValues | null;
    sites: { id: number; name: string }[];
    roles: { id: number; name: string }[];
};

export default function UserFormDialog({
    open,
    onOpenChange,
    user = null,
    sites,
    roles,
}: UserFormDialogProps) {
    const isEditing = user !== null;
    const action = isEditing
        ? updateUser.form({ user: user.id })
        : storeUser.form();
    const currentRole = user?.roles[0] ?? roles[0]?.name ?? 'viewer';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open ? (
                    <Form
                        key={user?.id ?? 'create'}
                        {...action}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">
                                        {isEditing ? 'Edit user' : 'Add user'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm">
                                        {isEditing
                                            ? 'Update account details, role, and site access.'
                                            : 'Create an account. Users sign in with the email and password you set.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="space-y-4 py-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-name">Name</Label>
                                        <Input
                                            id="user-name"
                                            name="name"
                                            defaultValue={user?.name ?? ''}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-email">Email</Label>
                                        <Input
                                            id="user-email"
                                            name="email"
                                            type="email"
                                            defaultValue={user?.email ?? ''}
                                            required
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-password">
                                            {isEditing ? 'New password (optional)' : 'Password'}
                                        </Label>
                                        <PasswordInput
                                            id="user-password"
                                            name="password"
                                            required={! isEditing}
                                            autoComplete="new-password"
                                            placeholder={isEditing ? 'Leave blank to keep current' : undefined}
                                        />
                                        <InputError message={errors.password} />
                                    </div>
                                    {! isEditing ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="user-password-confirmation">
                                                Confirm password
                                            </Label>
                                            <PasswordInput
                                                id="user-password-confirmation"
                                                name="password_confirmation"
                                                required
                                                autoComplete="new-password"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label htmlFor="user-password-confirmation">
                                                Confirm new password
                                            </Label>
                                            <PasswordInput
                                                id="user-password-confirmation"
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                placeholder="Only if changing password"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-role">Role</Label>
                                        <select
                                            id="user-role"
                                            name="role"
                                            defaultValue={currentRole}
                                            className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm"
                                        >
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.name}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.role} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="user-active">Status</Label>
                                        <select
                                            id="user-active"
                                            name="is_active"
                                            defaultValue={user?.is_active === false ? '0' : '1'}
                                            className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm"
                                        >
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                        <InputError message={errors.is_active} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Site access</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Leave all unchecked for roles with access to all sites.
                                        </p>
                                        <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                                            {sites.map((site) => (
                                                <label
                                                    key={site.id}
                                                    className="flex items-center gap-2 py-1 text-sm"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="site_ids[]"
                                                        value={site.id}
                                                        defaultChecked={user?.site_ids.includes(
                                                            site.id,
                                                        )}
                                                    />
                                                    {site.name}
                                                </label>
                                            ))}
                                        </div>
                                        <InputError message={errors.site_ids} />
                                    </div>
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        {isEditing ? 'Save changes' : 'Create user'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
