import { Form } from '@inertiajs/react';
import { Lock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import RoleController from '@/actions/App/Http/Controllers/Settings/RoleController';
import InputError from '@/components/input-error';
import PermissionMatrix from '@/components/permission-matrix';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import type { PermissionGroup, Role } from '@/types/permission';

type RoleFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    permissionGroups: PermissionGroup[];
    role?: Role | null;
    canDelete?: boolean;
};

export default function RoleFormDialog(props: RoleFormDialogProps) {
    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                {props.open && (
                    <RoleFormDialogBody
                        key={props.role?.id ?? 'create'}
                        {...props}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function RoleFormDialogBody({
    onOpenChange,
    permissionGroups,
    role = null,
    canDelete = false,
}: RoleFormDialogProps) {
    const isEditing = role !== null;
    const isSystem = isEditing && role.is_system;

    const [permissions, setPermissions] = useState<string[]>(
        role?.permissions ?? [],
    );
    const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

    const action = isEditing
        ? RoleController.update.form(role.id)
        : RoleController.store.form();

    return (
        <Form
            {...action}
            options={{ preserveScroll: true }}
            onSuccess={() => onOpenChange(false)}
            className="flex min-h-0 flex-1 flex-col"
        >
            {({ processing, errors }) => (
                <>
                    <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                        <DialogTitle className="text-xl font-semibold capitalize">
                            {isEditing ? role.name : 'Create role'}
                        </DialogTitle>
                        <DialogDescription className="text-sm">
                            {isEditing
                                ? 'Update the description and permissions granted by this role.'
                                : 'Define a new role and select the permissions it grants.'}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogBody className="space-y-6 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="role-name">Role name</Label>
                            <Input
                                id="role-name"
                                name="name"
                                defaultValue={role?.name ?? ''}
                                readOnly={isSystem}
                                required
                                autoComplete="off"
                                placeholder="e.g. editor"
                            />
                            {isSystem ? (
                                <Badge
                                    variant="secondary"
                                    className="w-fit gap-1 text-[10px]"
                                >
                                    <Lock className="size-3" />
                                    Cannot rename a system role
                                </Badge>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Lowercase letters, numbers, and hyphens
                                    only.
                                </p>
                            )}
                            <InputError message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="role-description">
                                Description
                            </Label>
                            <Textarea
                                id="role-description"
                                name="description"
                                defaultValue={role?.description ?? ''}
                                placeholder="What is this role responsible for?"
                                rows={3}
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Permission</p>

                            <PermissionMatrix
                                groups={permissionGroups}
                                value={permissions}
                                onChange={setPermissions}
                            />

                            <InputError
                                message={
                                    errors.permissions ??
                                    errors['permissions.0']
                                }
                            />
                        </div>
                    </DialogBody>

                    <DialogFooter className="flex flex-row items-center justify-between gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-between">
                        <div>
                            {isEditing && canDelete && !isSystem && (
                                <DeleteRoleInlineForm
                                    role={role}
                                    confirm={confirmDelete}
                                    onConfirmChange={setConfirmDelete}
                                />
                            )}
                        </div>

                        <div className="flex flex-row items-center gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={processing}
                                data-test={
                                    isEditing
                                        ? 'update-role-button'
                                        : 'store-role-button'
                                }
                            >
                                {isEditing ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

type DeleteRoleInlineFormProps = {
    role: Role;
    confirm: boolean;
    onConfirmChange: (next: boolean) => void;
};

function DeleteRoleInlineForm({
    role,
    confirm,
    onConfirmChange,
}: DeleteRoleInlineFormProps) {
    if (!confirm) {
        return (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onConfirmChange(true)}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                data-test={`delete-role-${role.name}`}
            >
                <Trash2 className="size-4" />
                Delete role
            </Button>
        );
    }

    return (
        <Form
            {...RoleController.destroy.form(role.id)}
            options={{ preserveScroll: true }}
            className="flex items-center gap-2"
        >
            {({ processing }) => (
                <>
                    <span className="text-xs text-destructive">
                        Delete this role permanently?
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfirmChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        variant="destructive"
                        disabled={processing}
                        data-test={`confirm-delete-role-${role.name}`}
                    >
                        Confirm delete
                    </Button>
                </>
            )}
        </Form>
    );
}
