import { Form, Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
    DeviceTableSection,
    TokenCell,
    type DeviceRow,
} from '@/components/iot/field-device-table';
import { IotViewLink } from '@/components/iot/iot-module-layout';
import {
    ConceptPageHeader,
    ConceptPageShell,
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
import { TableCell } from '@/components/ui/table';
import { useSiteContext } from '@/hooks/use-site-context';
import FieldDeviceController from '@/actions/App/Http/Controllers/FieldDeviceController';
import { overview as fieldDevicesOverview, show as fieldDeviceShow } from '@/routes/iot/field-devices';
import { index as gasGatewaysIndex } from '@/routes/iot/field-devices/gas-gateways';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';

type Props = {
    site: { id: number; name: string };
    devices: DeviceRow[];
    edgeOptions: { id: number; name: string; code: string }[];
    ingestTokenPlain: string | null;
    permissions: { canManage: boolean; canManageTokens: boolean };
};

export default function FieldDevicesGasGateways({
    site,
    devices,
    edgeOptions,
    ingestTokenPlain,
    permissions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [gasOpen, setGasOpen] = useState(false);

    return (
        <>
            <Head title={`Gas gateways — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Gas gateways"
                    description={`Vehicle-mounted gas concentrators for ${siteName}`}
                />

                {ingestTokenPlain ? (
                    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-medium">New ingest token (copy now — shown once)</p>
                        <p className="mt-1 font-mono text-sm break-all">{ingestTokenPlain}</p>
                    </div>
                ) : null}

                <DeviceTableSection
                    title="Gas gateways"
                    description="Vehicle-mounted gas concentrators"
                    devices={devices}
                    addDialog={
                        permissions.canManage && edgeOptions.length > 0 ? (
                            <Dialog open={gasOpen} onOpenChange={setGasOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="mr-1 size-4" />
                                        Add gateway
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Register gas gateway</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        {...FieldDeviceController.storeGasGateway.form()}
                                        onSuccess={() => setGasOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="gas-edge">Edge device</Label>
                                                    <select
                                                        id="gas-edge"
                                                        name="edge_device_id"
                                                        required
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                                    >
                                                        <option value="">Select edge…</option>
                                                        {edgeOptions.map((e) => (
                                                            <option key={e.id} value={e.id}>
                                                                {e.name} ({e.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError message={errors.edge_device_id} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="gas-name">Name</Label>
                                                    <Input id="gas-name" name="name" required />
                                                    <InputError message={errors.name} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="gas-code">Code</Label>
                                                    <Input id="gas-code" name="code" required />
                                                    <InputError message={errors.code} />
                                                </div>
                                                <Button type="submit" disabled={processing}>
                                                    Register
                                                </Button>
                                            </div>
                                        )}
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        ) : null
                    }
                    columns={['Code', 'Vehicle', 'Health', 'Last ingest', 'Token', '']}
                    renderRow={(d) => (
                        <>
                            <TableCell className="font-mono text-xs">{d.code}</TableCell>
                            <TableCell>{d.vehicle_label ?? '—'}</TableCell>
                            <TableCell>
                                <IotHealthBadge status={d.health_status} />
                            </TableCell>
                            <TableCell>
                                <IotRelativeTime iso={d.last_ingest_at} />
                            </TableCell>
                            <TableCell>
                                <TokenCell device={d} canManageTokens={permissions.canManageTokens} />
                            </TableCell>
                            <TableCell className="text-right">
                                <IotViewLink href={fieldDeviceShow({ type: 'gas', id: d.id })} />
                            </TableCell>
                        </>
                    )}
                />
            </ConceptPageShell>
        </>
    );
}

FieldDevicesGasGateways.layout = () => ({
    breadcrumbs: [
        { title: 'Field devices', href: fieldDevicesOverview() },
        { title: 'Gas gateways', href: gasGatewaysIndex() },
    ],
});
