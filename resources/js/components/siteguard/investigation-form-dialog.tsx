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
import { store as storeInvestigation } from '@/routes/investigations';

type InvestigationFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: { id: number; name: string }[];
};

export default function InvestigationFormDialog({
    open,
    onOpenChange,
    users,
}: InvestigationFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open ? (
                    <Form
                        {...storeInvestigation.form()}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">Open investigation</DialogTitle>
                                    <DialogDescription className="text-sm">
                                        Group related alerts into a tracked investigation.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="space-y-4 py-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-title">Title</Label>
                                        <Input id="inv-title" name="title" required />
                                        <InputError message={errors.title} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-assignee">Assign to</Label>
                                        <select
                                            id="inv-assignee"
                                            name="assigned_user_id"
                                            className="flex h-9 w-full rounded-md border border-input px-3 py-1 text-sm"
                                        >
                                            <option value="">Unassigned</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.assigned_user_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="inv-description">Description</Label>
                                        <Textarea id="inv-description" name="description" rows={3} />
                                        <InputError message={errors.description} />
                                    </div>
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>Open investigation</Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
