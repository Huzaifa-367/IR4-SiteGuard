import { Form } from '@inertiajs/react';
import InputError from '@/components/input-error';
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
import { store as storeInvestigationFromAlert } from '@/routes/alerts/investigations';

type CreateInvestigationFromAlertDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alertId: number;
    defaultTitle: string;
    users: { id: number; name: string }[];
};

export default function CreateInvestigationFromAlertDialog({
    open,
    onOpenChange,
    alertId,
    defaultTitle,
    users,
}: CreateInvestigationFromAlertDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open ? (
                    <Form
                        {...storeInvestigationFromAlert.form({ alert: alertId })}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">
                                        Open investigation
                                    </DialogTitle>
                                    <DialogDescription className="text-sm">
                                        Create an incident investigation and link this alert automatically.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="space-y-4 py-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-alert-title">Title</Label>
                                        <Input
                                            id="inv-alert-title"
                                            name="title"
                                            defaultValue={defaultTitle}
                                            required
                                        />
                                        <InputError message={errors.title} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-alert-priority">Priority</Label>
                                        <select
                                            id="inv-alert-priority"
                                            name="priority"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            defaultValue="high"
                                            required
                                        >
                                            <option value="critical">Critical</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                        <InputError message={errors.priority} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-alert-assignee">Assign to</Label>
                                        <select
                                            id="inv-alert-assignee"
                                            name="assigned_user_id"
                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            required
                                        >
                                            <option value="">Select assignee…</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.assigned_user_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-alert-description">Description</Label>
                                        <Textarea
                                            id="inv-alert-description"
                                            name="description"
                                            rows={4}
                                            placeholder="What happened, immediate risks, and next steps…"
                                            required
                                        />
                                        <InputError message={errors.description} />
                                    </div>
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        Create investigation
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
