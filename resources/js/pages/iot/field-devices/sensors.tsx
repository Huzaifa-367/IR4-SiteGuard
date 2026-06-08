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
import { index as sensorsIndex } from '@/routes/iot/field-devices/sensors';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';

type Props = {
    site: { id: number; name: string };
    devices: DeviceRow[];
    ingestTokenPlain: string | null;
    permissions: { canManage: boolean; canManageTokens: boolean };
    sensorDeviceTypeOptions: EnumOption[];
};

export default function FieldDevicesSensors({
    site,
    devices,
    ingestTokenPlain,
    permissions,
    sensorDeviceTypeOptions,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [sensorOpen, setSensorOpen] = useState(false);

    return (
        <>
            <Head title={`Sensors — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Sensor devices"
                    description={`CO₂, weather, and Modbus instruments for ${siteName}`}
                />

                {ingestTokenPlain ? (
                    <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
                        <p className="text-sm font-medium">New ingest token (copy now — shown once)</p>
                        <p className="mt-1 font-mono text-sm break-all">{ingestTokenPlain}</p>
                    </div>
                ) : null}

                <DeviceTableSection
                    title="Sensor devices"
                    description="CO₂, weather, and Modbus instruments"
                    devices={devices}
                    addDialog={
                        permissions.canManage ? (
                            <Dialog open={sensorOpen} onOpenChange={setSensorOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <Plus className="mr-1 size-4" />
                                        Add sensor
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Register sensor device</DialogTitle>
                                    </DialogHeader>
                                    <Form
                                        {...FieldDeviceController.storeSensorDevice.form()}
                                        onSuccess={() => setSensorOpen(false)}
                                    >
                                        {({ processing, errors }) => (
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="sensor-name">Name</Label>
                                                    <Input id="sensor-name" name="name" required />
                                                    <InputError message={errors.name} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="sensor-code">Code</Label>
                                                    <Input id="sensor-code" name="code" required />
                                                    <InputError message={errors.code} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="sensor-type">Device type</Label>
                                                    <EnumSelect
                                                        id="sensor-type"
                                                        name="device_type"
                                                        options={sensorDeviceTypeOptions}
                                                        defaultValue={
                                                            sensorDeviceTypeOptions.find((o) => o.value === 'co2_ndir')?.value
                                                            ?? sensorDeviceTypeOptions[0]?.value
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
                    columns={['Code', 'Type', 'Health', 'Last ingest', 'Token', '']}
                    renderRow={(d) => (
                        <>
                            <TableCell className="font-mono text-xs">{d.code}</TableCell>
                            <TableCell>{d.device_type}</TableCell>
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
                                <IotViewLink href={fieldDeviceShow({ type: 'sensor', id: d.id })} />
                            </TableCell>
                        </>
                    )}
                />
            </ConceptPageShell>
        </>
    );
}

FieldDevicesSensors.layout = () => ({
    breadcrumbs: [
        { title: 'Field devices', href: fieldDevicesOverview() },
        { title: 'Sensors', href: sensorsIndex() },
    ],
});
