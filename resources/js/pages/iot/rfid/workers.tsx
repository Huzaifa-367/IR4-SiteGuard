import { Form, Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
} from '@/components/concepts';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSiteContext } from '@/hooks/use-site-context';
import RfidOperationsController from '@/actions/App/Http/Controllers/RfidOperationsController';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as workersIndex } from '@/routes/iot/rfid/workers';
import { IotHealthBadge } from '@/components/iot/iot-ui';
import { type EnumOption } from '@/components/siteguard/enum-select';

type Props = {
    site: { id: number; name: string };
    workers: {
        id: number;
        full_name: string;
        contractor: string;
        tag_epc: string;
        portable_device_approved: boolean;
        role: string;
    }[];
    permissions: { canManageWorkers: boolean };
    contractorOptions: EnumOption[];
};

export default function RfidWorkers({ site, workers, permissions, contractorOptions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [workerOpen, setWorkerOpen] = useState(false);

    return (
        <>
            <Head title={`RFID workers — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Registered workers"
                    description={`Worker tag registry for ${siteName}`}
                />

                <ConceptTableCard>
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="font-semibold">Registered workers</h2>
                        {permissions.canManageWorkers ? (
                            <Dialog open={workerOpen} onOpenChange={setWorkerOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><Plus className="mr-1 size-4" />Register worker</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Register worker tag</DialogTitle></DialogHeader>
                                    <Form {...RfidOperationsController.storeWorker.form()} onSuccess={() => setWorkerOpen(false)}>
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div><Label htmlFor="tag-epc">Tag EPC</Label><Input id="tag-epc" name="tag_epc" required /><InputError message={errors.tag_epc} /></div>
                                                <div><Label htmlFor="full-name">Full name</Label><Input id="full-name" name="full_name" required /><InputError message={errors.full_name} /></div>
                                                <div>
                                                    <Label htmlFor="contractor">Contractor</Label>
                                                    <Input id="contractor" name="contractor" list="contractor-suggestions" required />
                                                    {contractorOptions.length > 0 ? (
                                                        <datalist id="contractor-suggestions">
                                                            {contractorOptions.map((option) => (
                                                                <option key={option.value} value={option.value} />
                                                            ))}
                                                        </datalist>
                                                    ) : null}
                                                    <InputError message={errors.contractor} />
                                                </div>
                                                <div><Label htmlFor="role">Role</Label><Input id="role" name="role" required /><InputError message={errors.role} /></div>
                                                <Button type="submit" disabled={processing}>Register</Button>
                                            </div>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        ) : null}
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contractor</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Tag EPC</TableHead>
                                <TableHead>Portable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workers.map((w) => (
                                <TableRow key={w.id}>
                                    <TableCell>{w.full_name}</TableCell>
                                    <TableCell>{w.contractor}</TableCell>
                                    <TableCell>{w.role}</TableCell>
                                    <TableCell className="font-mono text-xs">{w.tag_epc}</TableCell>
                                    <TableCell>
                                        <IotHealthBadge status={w.portable_device_approved ? 'approved' : 'pending'} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

RfidWorkers.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Workers', href: workersIndex() },
    ],
});
