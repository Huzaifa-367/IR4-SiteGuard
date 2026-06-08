import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
} from '@/components/concepts';
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
import { index as portableDevicesIndex } from '@/routes/iot/rfid/portable-devices';
import { IotHealthBadge } from '@/components/iot/iot-ui';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';

type Props = {
    site: { id: number; name: string };
    portableRegister: {
        id: number;
        full_name: string;
        contractor: string;
        portable_device_approved: boolean;
        portable_devices: { type: string; serial?: string; approved_at?: string }[];
    }[];
    permissions: { canManageWorkers: boolean };
    portableDeviceTypeOptions: EnumOption[];
};

export default function RfidPortableDevices({ site, portableRegister, permissions, portableDeviceTypeOptions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [portableOpen, setPortableOpen] = useState<number | null>(null);

    return (
        <>
            <Head title={`Portable devices — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Portable device register"
                    description={`SA Restriction of Portable Devices GI compliance for ${siteName}`}
                />

                <ConceptTableCard>
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Portable device register</h2>
                        <p className="text-sm text-muted-foreground">Approved portable devices per worker</p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Worker</TableHead>
                                <TableHead>Contractor</TableHead>
                                <TableHead>Approved</TableHead>
                                <TableHead>Devices</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {portableRegister.map((w) => (
                                <TableRow key={w.id}>
                                    <TableCell>{w.full_name}</TableCell>
                                    <TableCell>{w.contractor}</TableCell>
                                    <TableCell>
                                        <IotHealthBadge status={w.portable_device_approved ? 'approved' : 'pending'} />
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {w.portable_devices.length > 0
                                            ? w.portable_devices.map((d) => d.type).join(', ')
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {permissions.canManageWorkers ? (
                                            <Dialog open={portableOpen === w.id} onOpenChange={(o) => setPortableOpen(o ? w.id : null)}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm" variant="outline">Edit</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader><DialogTitle>Portable devices — {w.full_name}</DialogTitle></DialogHeader>
                                                    <Form
                                                        {...RfidOperationsController.updatePortableDevices.form({ worker: w.id })}
                                                        onSuccess={() => setPortableOpen(null)}
                                                    >
                                                        {({ processing }) => (
                                                            <div className="space-y-4">
                                                                <label className="flex items-center gap-2 text-sm">
                                                                    <input type="hidden" name="portable_device_approved" value="0" />
                                                                    <input type="checkbox" name="portable_device_approved" value="1" defaultChecked={w.portable_device_approved} />
                                                                    Device approval granted
                                                                </label>
                                                                <div>
                                                                    <Label htmlFor={`portable-type-${w.id}`}>Device type</Label>
                                                                    <EnumSelect
                                                                        id={`portable-type-${w.id}`}
                                                                        name="portable_devices[0][type]"
                                                                        options={portableDeviceTypeOptions}
                                                                        defaultValue={
                                                                            w.portable_devices[0]?.type
                                                                            ?? portableDeviceTypeOptions[0]?.value
                                                                        }
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label>Serial</Label>
                                                                    <Input name="portable_devices[0][serial]" defaultValue={w.portable_devices[0]?.serial ?? ''} />
                                                                </div>
                                                                <Button type="submit" disabled={processing}>Save</Button>
                                                            </div>
                                                        )}
                                                    </Form>
                                                </DialogContent>
                                            </Dialog>
                                        ) : null}
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

RfidPortableDevices.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Portable devices', href: portableDevicesIndex() },
    ],
});
