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
import { index as rfidReadersIndex } from '@/routes/iot/field-devices/rfid-readers';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';

type Props = {
    site: { id: number; name: string };
    devices: Paginator<DeviceRow>;
    filters: TimeRangeFilters;
    rfidZones: { id: number; name: string; code: string; zone_type: string }[];
    ingestTokenPlain: string | null;
    permissions: { canManage: boolean; canManageTokens: boolean };
    mountTypeOptions: EnumOption[];
};

export default function FieldDevicesRfidReaders({
    site,
    devices,
    filters,
    rfidZones,
    ingestTokenPlain,
    permissions,
    mountTypeOptions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [rfidOpen, setRfidOpen] = useState(false);

    return (
        <>
            <Head title={`RFID readers — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="RFID readers"
                    description={`${devices.total.toLocaleString()} readers in ${filters.label.toLowerCase()} — ${siteName}`}
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
                    title="RFID readers"
                    description="Gate and zone antennas"
                    devices={devices}
                    addDialog={
                        permissions.canManage ? (
                            <Dialog open={rfidOpen} onOpenChange={setRfidOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="mr-1 size-4" />
                                        Add reader
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Register RFID reader</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        {...FieldDeviceController.storeRfidReader.form()}
                                        onSuccess={() => setRfidOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="rfid-name">Name</Label>
                                                    <Input id="rfid-name" name="name" required />
                                                    <InputError message={errors.name} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="rfid-code">Code</Label>
                                                    <Input id="rfid-code" name="code" required />
                                                    <InputError message={errors.code} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="rfid-zone">Zone</Label>
                                                    <select
                                                        id="rfid-zone"
                                                        name="rfid_zone_id"
                                                        required
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                                                    >
                                                        <option value="">Select zone…</option>
                                                        {rfidZones.map((z) => (
                                                            <option key={z.id} value={z.id}>
                                                                {z.name} ({z.code})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <InputError message={errors.rfid_zone_id} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="rfid-mount">Mount type</Label>
                                                    <EnumSelect
                                                        id="rfid-mount"
                                                        name="mount_type"
                                                        options={mountTypeOptions}
                                                        defaultValue={
                                                            mountTypeOptions.find((o) => o.value === 'gate')?.value
                                                            ?? mountTypeOptions[0]?.value
                                                        }
                                                    />
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
                    columns={['Code', 'Zone', 'Health', 'Last ingest', 'Token', '']}
                    renderRow={(d) => (
                        <>
                            <TableCell className="font-mono text-xs">{d.code}</TableCell>
                            <TableCell>{d.zone ?? '—'}</TableCell>
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
                                <IotViewLink href={fieldDeviceShow({ type: 'rfid', id: d.id })} />
                            </TableCell>
                        </>
                    )}
                />
            </ConceptPageShell>
        </>
    );
}

FieldDevicesRfidReaders.layout = () => ({
    breadcrumbs: [
        { title: 'Field devices', href: fieldDevicesOverview() },
        { title: 'RFID readers', href: rfidReadersIndex() },
    ],
});
