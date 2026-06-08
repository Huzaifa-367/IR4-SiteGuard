import { Form } from '@inertiajs/react';
import { useState } from 'react';
import UserRoleController from '@/actions/App/Http/Controllers/Settings/UserRoleController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { RoleSummary, UserWithRoles } from '@/types/permission';

type UserRolesDialogProps = {
    user: UserWithRoles;
    roles: RoleSummary[];
    trigger: React.ReactNode;
};

export default function UserRolesDialog({
    user,
    roles,
    trigger,
}: UserRolesDialogProps) {
    const initialRole = user.roles[0]?.name ?? '';
    const [open, setOpen] = useState<boolean>(false);
    const [selected, setSelected] = useState<string>(initialRole);
    const hasSelection = selected !== '';

    const reset = (): void => setSelected(initialRole);

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next);

                if (!next) {
                    reset();
                }
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="flex max-h-[min(90vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 space-y-2 px-6 pt-6 pb-2">
                    <DialogTitle>Assign role to {user.name}</DialogTitle>
                    <DialogDescription>
                        Choose a role for{' '}
                        <span className="font-medium">{user.email}</span>. A
                        user must have exactly one role.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...UserRoleController.update.form(user.id)}
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    {({ processing, errors }) => (
                        <>
                            <input type="hidden" name="role" value={selected} />

                            <DialogBody className="space-y-4 py-3">
                                {roles.length === 0 ? (
                                    <p className="rounded-md border px-2 py-6 text-center text-sm text-muted-foreground">
                                        No roles available. Create a role first.
                                    </p>
                                ) : (
                                    <RadioGroup
                                        value={selected}
                                        onValueChange={setSelected}
                                        aria-label="Select a role"
                                        className="gap-2 rounded-md border p-2"
                                    >
                                        {roles.map((role) => (
                                            <RoleRadioOption
                                                key={role.id}
                                                id={`role-${user.id}-${role.id}`}
                                                value={role.name}
                                                selected={selected === role.name}
                                                title={role.name}
                                                description={role.description}
                                                badge={role.name}
                                            />
                                        ))}
                                    </RadioGroup>
                                )}

                                <InputError message={errors.role} />
                            </DialogBody>

                            <DialogFooter className="shrink-0 gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-end">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        reset();
                                        setOpen(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !hasSelection}
                                    data-test={`save-user-role-${user.id}`}
                                >
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

type RoleRadioOptionProps = {
    id: string;
    value: string;
    selected: boolean;
    title: string;
    description?: string | null;
    badge?: string;
};

function RoleRadioOption({
    id,
    value,
    selected,
    title,
    description,
    badge,
}: RoleRadioOptionProps) {
    return (
        <Label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-md border border-transparent p-2 font-normal transition-colors hover:bg-muted/40',
                selected && 'border-primary/40 bg-primary/5',
            )}
        >
            <RadioGroupItem id={id} value={value} className="mt-1" />

            <div className="flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium capitalize">
                        {title}
                    </span>
                    {badge && (
                        <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase"
                        >
                            {badge}
                        </Badge>
                    )}
                </div>
                {description && (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
        </Label>
    );
}
