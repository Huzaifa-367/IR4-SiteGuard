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
import { store as storeZone } from '@/routes/cameras/zones';

const defaultPolygon = [
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
];

type ZoneFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cameraId: number;
    siteRules: { id: number; name: string; code: string }[];
};

export default function ZoneFormDialog({
    open,
    onOpenChange,
    cameraId,
    siteRules,
}: ZoneFormDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,40rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open ? (
                    <Form
                        {...storeZone.form({ camera: cameraId })}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">Add zone</DialogTitle>
                                    <DialogDescription className="text-sm">
                                        Creates a default rectangular zone. Polygon editor coming later.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="space-y-4 py-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="zone-name">Name</Label>
                                        <Input id="zone-name" name="name" required placeholder="Loading dock" />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Linked rules</Label>
                                        <div className="flex max-h-32 flex-wrap gap-3 overflow-y-auto rounded-md border p-2">
                                            {siteRules.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No rules for this module.</p>
                                            ) : (
                                                siteRules.map((rule) => (
                                                    <label key={rule.id} className="flex items-center gap-2 text-sm">
                                                        <input type="checkbox" name="rule_ids[]" value={rule.id} />
                                                        {rule.code} — {rule.name}
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    {defaultPolygon.map((point, index) => (
                                        <div key={index} className="hidden">
                                            <input type="hidden" name={`polygon[${index}][x]`} value={point.x} />
                                            <input type="hidden" name={`polygon[${index}][y]`} value={point.y} />
                                        </div>
                                    ))}
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">Cancel</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>Add zone</Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
