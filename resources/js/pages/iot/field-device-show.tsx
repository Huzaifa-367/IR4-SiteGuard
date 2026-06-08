import { Form, Head, Link } from '@inertiajs/react';
import { KeyRound } from 'lucide-react';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotLinkedResource,
    IotModuleSection,
} from '@/components/iot/iot-module-layout';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { Button } from '@/components/ui/button';
import { useSiteContext } from '@/hooks/use-site-context';
import FieldDeviceController from '@/actions/App/Http/Controllers/FieldDeviceController';
import { ConceptTableCard } from '@/components/concepts';
import {
    overview as fieldDevicesOverview,
    show as fieldDeviceShow,
} from '@/routes/iot/field-devices';
import { index as gasReadingsIndex } from '@/routes/iot/gas/readings';
import { overview as gasOverview } from '@/routes/iot/gas';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { show as zoneShow } from '@/routes/iot/rfid/zones';

type Device = {
    id: number;
    name: string;
    code: string;
    health_status: string;
    token_type: string;
    mount_type?: string;
    rfid_zone_id?: number | null;
    zone?: string | null;
    zone_code?: string | null;
    vehicle_label?: string | null;
    device_type?: string;
    last_heartbeat_at?: string | null;
    last_ingest_at?: string | null;
    edge_device?: { id: number; name: string; code: string } | null;
    modbus_config?: Record<string, unknown> | null;
    ingest_token: {
        prefix: string;
        revoked: boolean;
        last_used_at: string | null;
    } | null;
};

type GasReadingRow = {
    lel_pct: string | number;
    o2_pct: string | number;
    h2s_ppm: string | number;
    co_ppm: string | number;
    alarm_state: string;
    read_at: string;
};

type SensorReadingRow = {
    parameter: string;
    value: string | number;
    unit: string;
    read_at: string;
};

type Props = {
    site: { id: number; name: string };
    deviceType: 'edge' | 'rfid' | 'gas' | 'sensor';
    device: Device;
    recentReadings: GasReadingRow[] | SensorReadingRow[];
    permissions: { canManageTokens: boolean };
};

const TYPE_LABELS: Record<Props['deviceType'], string> = {
    edge: 'Edge device',
    rfid: 'RFID reader',
    gas: 'Gas gateway',
    sensor: 'Sensor device',
};

export default function FieldDeviceShow({ site, deviceType, device, recentReadings, permissions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const lastActivity = device.last_ingest_at ?? device.last_heartbeat_at;

    return (
        <>
            <Head title={`${device.name} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={device.name}
                    description={`${TYPE_LABELS[deviceType]} · ${device.code} · ${siteName}`}
                >
                    <Link href={fieldDevicesOverview()} className="text-sm text-primary hover:underline">
                        Back to field devices
                    </Link>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="Health"
                        value={<IotHealthBadge status={device.health_status} />}
                    />
                    <IotDetailStat
                        label="Last activity"
                        value={lastActivity ? <IotRelativeTime iso={lastActivity} /> : '—'}
                    />
                    <IotDetailStat
                        label="Ingest token"
                        value={device.ingest_token ? `${device.ingest_token.prefix}…` : 'Not issued'}
                        sub={
                            device.ingest_token?.revoked
                                ? 'Revoked'
                                : device.ingest_token?.last_used_at
                                  ? 'Active'
                                  : undefined
                        }
                    />
                    <IotDetailStat
                        label="Type"
                        value={formatHumanLabel(deviceType)}
                        sub={device.device_type ? formatHumanLabel(device.device_type) : device.mount_type ? formatHumanLabel(device.mount_type) : undefined}
                    />
                </IotDetailStatGrid>

                <div className="grid gap-4 lg:grid-cols-2">
                    <IotModuleSection title="Device profile" description="Registration metadata">
                        <dl className="space-y-3 rounded-lg border border-border/80 bg-card p-4 text-sm">
                            {device.mount_type ? (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Mount</dt>
                                    <dd>{formatHumanLabel(device.mount_type)}</dd>
                                </div>
                            ) : null}
                            {device.zone && device.rfid_zone_id ? (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">RFID zone</dt>
                                    <dd>
                                        <Link
                                            href={zoneShow(device.rfid_zone_id)}
                                            className="text-primary hover:underline"
                                        >
                                            {device.zone}
                                            {device.zone_code ? ` (${device.zone_code})` : ''}
                                        </Link>
                                    </dd>
                                </div>
                            ) : null}
                            {device.vehicle_label ? (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Vehicle</dt>
                                    <dd>{device.vehicle_label}</dd>
                                </div>
                            ) : null}
                            {device.edge_device ? (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Edge host</dt>
                                    <dd>
                                        <Link
                                            href={fieldDeviceShow({ type: 'edge', id: device.edge_device.id })}
                                            className="text-primary hover:underline"
                                        >
                                            {device.edge_device.name}
                                        </Link>
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    </IotModuleSection>

                    <IotModuleSection title="Related modules" description="Jump to operational views">
                        <div className="grid gap-2">
                            {deviceType === 'gas' ? (
                                <>
                                    <IotLinkedResource label="All readings" href={gasReadingsIndex()} hint="Live gas and sensor data" />
                                    <IotLinkedResource label="Gas overview" href={gasOverview()} hint="Thresholds and analytics" />
                                </>
                            ) : null}
                            {deviceType === 'rfid' ? (
                                <IotLinkedResource label="RFID / SSMS" href={rfidOverview()} hint="Zone occupancy and gate flow" />
                            ) : null}
                            {(deviceType === 'sensor' || deviceType === 'gas') ? (
                                <IotLinkedResource label="Environmental data" href={gasOverview()} hint="CO₂ and weather trends" />
                            ) : null}
                        </div>
                    </IotModuleSection>
                </div>

                {recentReadings.length > 0 ? (
                    <ConceptTableCard
                        className="mt-4"
                        title="Recent readings"
                        description="Last 20 ingest events for this device"
                    >
                        {deviceType === 'gas' ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">Time</th>
                                        <th className="px-4 py-2 font-medium">LEL</th>
                                        <th className="px-4 py-2 font-medium">O₂</th>
                                        <th className="px-4 py-2 font-medium">H₂S</th>
                                        <th className="px-4 py-2 font-medium">CO</th>
                                        <th className="px-4 py-2 font-medium">Alarm</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recentReadings as GasReadingRow[]).map((row, index) => (
                                        <tr key={index} className="border-b border-border/60">
                                            <td className="px-4 py-2"><IotRelativeTime iso={row.read_at} /></td>
                                            <td className="px-4 py-2 tabular-nums">{row.lel_pct}%</td>
                                            <td className="px-4 py-2 tabular-nums">{row.o2_pct}%</td>
                                            <td className="px-4 py-2 tabular-nums">{row.h2s_ppm}</td>
                                            <td className="px-4 py-2 tabular-nums">{row.co_ppm}</td>
                                            <td className="px-4 py-2">
                                                <IotHealthBadge status={row.alarm_state} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">Time</th>
                                        <th className="px-4 py-2 font-medium">Parameter</th>
                                        <th className="px-4 py-2 font-medium">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(recentReadings as SensorReadingRow[]).map((row, index) => (
                                        <tr key={index} className="border-b border-border/60">
                                            <td className="px-4 py-2"><IotRelativeTime iso={row.read_at} /></td>
                                            <td className="px-4 py-2">{formatHumanLabel(row.parameter)}</td>
                                            <td className="px-4 py-2 tabular-nums">
                                                {row.value} {row.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </ConceptTableCard>
                ) : null}

                {permissions.canManageTokens ? (
                    <IotModuleSection
                        title="API ingest token"
                        description="Rotate credentials for edge POST authentication"
                        className="mt-4"
                        action={
                            <Form
                                {...FieldDeviceController.issueToken.form({
                                    type: device.token_type,
                                    id: device.id,
                                })}
                            >
                                {({ processing }) => (
                                    <Button type="submit" size="sm" variant="outline" disabled={processing}>
                                        <KeyRound className="mr-1 size-4" />
                                        {device.ingest_token ? 'Rotate token' : 'Issue token'}
                                    </Button>
                                )}
                            </Form>
                        }
                    >
                        <div className="rounded-lg border border-border/80 bg-card p-4 text-sm">
                            {device.ingest_token ? (
                                <dl className="space-y-2">
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-muted-foreground">Prefix</dt>
                                        <dd className="font-mono">{device.ingest_token.prefix}</dd>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-muted-foreground">Last used</dt>
                                        <dd>
                                            <IotRelativeTime iso={device.ingest_token.last_used_at} />
                                        </dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-muted-foreground">No token issued — generate one to enable ingest.</p>
                            )}
                        </div>
                    </IotModuleSection>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

FieldDeviceShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'Field devices', href: fieldDevicesOverview() },
        {
            title: props.device.name,
            href: fieldDeviceShow({ type: props.deviceType, id: props.device.id }),
        },
    ],
});
