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
    TimeRangeSelect,
    type TimeRangeFilters,
} from '@/components/concepts';
import type { Paginator } from '@/types/pagination';
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
import { index as edgeIndex } from '@/routes/iot/field-devices/edge';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';

type Props = {
    site: { id: number; name: string };
    devices: Paginator<DeviceRow>;
    filters: TimeRangeFilters;
    ingestTokenPlain: string | null;
    permissions: { canManage: boolean; canManageTokens: boolean };
    mountTypeOptions: EnumOption[];
};

export default function FieldDevicesEdge({ site, devices, filters, ingestTokenPlain, permissions, mountTypeOptions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [edgeOpen, setEdgeOpen] = useState(false);

    return (
        <>
            <Head title={`Edge devices — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Edge devices"
                    description={`${devices.total.toLocaleString()} devices in ${filters.label.toLowerCase()} — ${siteName}`}
                >
                    <TimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                {ingestTokenPlain ? (
                    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-medium">New ingest token (copy now — shown once)</p>
                        <p className="mt-1 font-mono text-sm break-all">{ingestTokenPlain}</p>
                    </div>
                ) : null}

                <DeviceTableSection
                    title="Edge devices"
                    description="Jetson / vehicle / pole compute units"
                    devices={devices}
                    addDialog={
                        permissions.canManage ? (
                            <Dialog open={edgeOpen} onOpenChange={setEdgeOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <Plus className="mr-1 size-4" />
                                        Add edge
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Register edge device</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        {...FieldDeviceController.storeEdge.form()}
                                        onSuccess={() => setEdgeOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="edge-name">Name</Label>
                                                    <Input id="edge-name" name="name" required />
                                                    <InputError message={errors.name} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="edge-code">Code</Label>
                                                    <Input id="edge-code" name="code" required />
                                                    <InputError message={errors.code} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="edge-mount">Mount type</Label>
                                                    <EnumSelect
                                                        id="edge-mount"
                                                        name="mount_type"
                                                        options={mountTypeOptions}
                                                        defaultValue={mountTypeOptions[0]?.value ?? 'pole'}
                                                    />
                                                    <InputError message={errors.mount_type} />
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
                    columns={['Code', 'Name', 'Health', 'Last heartbeat', 'Token', '']}
                    renderRow={(d) => (
                        <>
                            <TableCell className="font-mono text-xs">{d.code}</TableCell>
                            <TableCell>{d.name}</TableCell>
                            <TableCell>
                                <IotHealthBadge status={d.health_status} />
                            </TableCell>
                            <TableCell>
                                <IotRelativeTime iso={d.last_heartbeat_at} />
                            </TableCell>
                            <TableCell>
                                <TokenCell device={d} canManageTokens={permissions.canManageTokens} />
                            </TableCell>
                            <TableCell className="text-right">
                                <IotViewLink href={fieldDeviceShow({ type: 'edge', id: d.id })} />
                            </TableCell>
                        </>
                    )}
                />
            </ConceptPageShell>
        </>
    );
}

FieldDevicesEdge.layout = () => ({
    breadcrumbs: [
        { title: 'Field devices', href: fieldDevicesOverview() },
        { title: 'Edge devices', href: edgeIndex() },
    ],
});
