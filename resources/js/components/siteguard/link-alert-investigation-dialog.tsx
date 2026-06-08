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
import { Label } from '@/components/ui/label';
import { link as linkInvestigation } from '@/routes/alerts/investigations';

type LinkAlertInvestigationDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    alertId: number;
    investigations: { id: number; title: string }[];
};

export default function LinkAlertInvestigationDialog({
    open,
    onOpenChange,
    alertId,
    investigations,
}: LinkAlertInvestigationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                {open ? (
                    <Form
                        {...linkInvestigation.form({ alert: alertId })}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Link to investigation</DialogTitle>
                                    <DialogDescription>
                                        Attach this alert to an existing open investigation on the same site.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="py-4">
                                    {investigations.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            No open investigations on this site. Create a new investigation instead.
                                        </p>
                                    ) : (
                                        <div className="grid gap-2">
                                            <Label htmlFor="investigation_id">Investigation</Label>
                                            <select
                                                id="investigation_id"
                                                name="investigation_id"
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                                required
                                            >
                                                <option value="">Select investigation…</option>
                                                {investigations.map((investigation) => (
                                                    <option key={investigation.id} value={investigation.id}>
                                                        {investigation.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.investigation_id} />
                                        </div>
                                    )}
                                </DialogBody>
                                <DialogFooter className="gap-2 sm:justify-end">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        disabled={processing || investigations.length === 0}
                                    >
                                        Link alert
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
