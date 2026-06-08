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
import { store as storeSite, update as updateSite } from '@/routes/sites';

export type SiteFormValues = {
    id: number;
    name: string;
    code: string | null;
    timezone: string;
    address: string | null;
    status: string;
};

type SiteFormDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    timezones: string[];
    site?: SiteFormValues | null;
};

export default function SiteFormDialog({
    open,
    onOpenChange,
    timezones,
    site = null,
}: SiteFormDialogProps) {
    const isEditing = site !== null;
    const action = isEditing
        ? updateSite.form({ site: site.id })
        : storeSite.form();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(90vh,36rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                {open ? (
                    <Form
                        key={site?.id ?? 'create'}
                        {...action}
                        options={{ preserveScroll: true }}
                        onSuccess={() => onOpenChange(false)}
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
                                    <DialogTitle className="text-xl font-semibold">
                                        {isEditing ? 'Edit site' : 'Create site'}
                                    </DialogTitle>
                                    <DialogDescription className="text-sm">
                                        {isEditing
                                            ? 'Update site metadata and status.'
                                            : 'Register a new construction site for cameras and safety monitoring.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogBody className="space-y-4 py-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="site-name">Name</Label>
                                        <Input
                                            id="site-name"
                                            name="name"
                                            defaultValue={site?.name ?? ''}
                                            required
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="site-code">Code</Label>
                                        <Input id="site-code" name="code" defaultValue={site?.code ?? ''} placeholder="DEMO-01" />
                                        <InputError message={errors.code} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="site-timezone">Timezone</Label>
                                        <select
                                            id="site-timezone"
                                            name="timezone"
                                            required
                                            defaultValue={site?.timezone ?? 'Asia/Dubai'}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                        >
                                            {timezones.map((tz) => (
                                                <option key={tz} value={tz}>{tz}</option>
                                            ))}
                                        </select>
                                        <InputError message={errors.timezone} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="site-address">Address</Label>
                                        <Input id="site-address" name="address" defaultValue={site?.address ?? ''} />
                                        <InputError message={errors.address} />
                                    </div>
                                    {isEditing ? (
                                        <div className="grid gap-2">
                                            <Label htmlFor="site-status">Status</Label>
                                            <select
                                                id="site-status"
                                                name="status"
                                                defaultValue={site?.status ?? 'active'}
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                            >
                                                <option value="active">Active</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                            <InputError message={errors.status} />
                                        </div>
                                    ) : null}
                                    {!isEditing ? <input type="hidden" name="status" value="active" /> : null}
                                </DialogBody>
                                <DialogFooter className="flex flex-row items-center justify-end gap-2 border-t bg-muted/30 px-6 py-3">
                                    <DialogClose asChild>
                                        <Button type="button" variant="secondary">
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={processing}>
                                        {isEditing ? 'Save changes' : 'Create site'}
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
