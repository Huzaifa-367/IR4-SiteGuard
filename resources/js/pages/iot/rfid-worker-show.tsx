import { Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotLinkedResource,
    IotModuleSection,
    IotViewLink,
} from '@/components/iot/iot-module-layout';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { useSiteContext } from '@/hooks/use-site-context';
import { show as lsrShow } from '@/routes/iot/lsr';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { show as gateLogShow } from '@/routes/iot/rfid/gate-log';
import { index as workersIndex, show as workerShow } from '@/routes/iot/rfid/workers';
import { show as zoneShow } from '@/routes/iot/rfid/zones';
import { show as fieldDeviceShow } from '@/routes/iot/field-devices';

type Props = {
    site: { id: number; name: string };
    worker: {
        id: number;
        tag_epc: string;
        employee_number: string | null;
        full_name: string;
        contractor: string;
        role: string;
        nationality: string | null;
        is_active: boolean;
        portable_device_approved: boolean;
        portable_devices: { type: string; serial?: string; approved_at?: string }[];
    };
    lastSeen: {
        is_on_site: boolean;
        last_seen_at: string;
        zone: { id: number; name: string; code: string } | null;
        reader: { id: number; name: string; code: string } | null;
    } | null;
    authorizedZones: { id: number; name: string; code: string; zone_type: string }[];
    gateHistory: {
        id: number;
        direction: string;
        occurred_at: string;
        gate_reader: { id: number; name: string; code: string } | null;
    }[];
    lsrViolations: {
        id: number;
        lsr_category: string;
        detection_mode: string;
        occurred_at: string;
        description: string;
    }[];
};

export default function RfidWorkerShow({
    site,
    worker,
    lastSeen,
    authorizedZones,
    gateHistory,
    lsrViolations,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`${worker.full_name} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={worker.full_name}
                    description={`${worker.contractor} · ${worker.role} · ${siteName}`}
                >
                    <Link href={workersIndex()} className="text-sm text-primary hover:underline">
                        Back to workers
                    </Link>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="On-site status"
                        value={
                            lastSeen ? (
                                <IotHealthBadge status={lastSeen.is_on_site ? 'on_site' : 'off_site'} />
                            ) : (
                                'Unknown'
                            )
                        }
                        sub={lastSeen ? <IotRelativeTime iso={lastSeen.last_seen_at} /> : undefined}
                    />
                    <IotDetailStat label="Tag EPC" value={<span className="font-mono text-xs">{worker.tag_epc}</span>} />
                    <IotDetailStat
                        label="Portable devices"
                        value={<IotHealthBadge status={worker.portable_device_approved ? 'approved' : 'pending'} />}
                        sub={`${worker.portable_devices.length} registered`}
                    />
                    <IotDetailStat
                        label="Registration"
                        value={worker.is_active ? 'Active' : 'Inactive'}
                        sub={worker.employee_number ?? undefined}
                    />
                </IotDetailStatGrid>

                <div className="grid gap-4 lg:grid-cols-2">
                    <IotModuleSection title="Worker profile" description="Registry metadata">
                        <dl className="space-y-3 rounded-lg border border-border/80 bg-card p-4 text-sm">
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Contractor</dt>
                                <dd>{worker.contractor}</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Role</dt>
                                <dd>{worker.role}</dd>
                            </div>
                            {worker.nationality ? (
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Nationality</dt>
                                    <dd>{worker.nationality}</dd>
                                </div>
                            ) : null}
                        </dl>
                    </IotModuleSection>

                    <IotModuleSection title="Last known location" description="RFID traceability">
                        {lastSeen ? (
                            <div className="grid gap-2">
                                {lastSeen.zone ? (
                                    <IotLinkedResource
                                        label="RFID zone"
                                        href={zoneShow(lastSeen.zone.id)}
                                        hint={`${lastSeen.zone.name} (${lastSeen.zone.code})`}
                                    />
                                ) : (
                                    <p className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                                        No zone association on last read.
                                    </p>
                                )}
                                {lastSeen.reader ? (
                                    <IotLinkedResource
                                        label="Last reader"
                                        href={fieldDeviceShow({ type: 'rfid', id: lastSeen.reader.id })}
                                        hint={`${lastSeen.reader.name} (${lastSeen.reader.code})`}
                                    />
                                ) : null}
                            </div>
                        ) : (
                            <p className="rounded-lg border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                                No RFID reads recorded for this worker yet.
                            </p>
                        )}
                    </IotModuleSection>
                </div>

                {worker.portable_devices.length > 0 ? (
                    <ConceptTableCard className="mt-4" title="Portable devices" description="Approved portable equipment">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Type</th>
                                    <th className="px-4 py-2 font-medium">Serial</th>
                                    <th className="px-4 py-2 font-medium">Approved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {worker.portable_devices.map((device, index) => (
                                    <tr key={index} className="border-b border-border/60">
                                        <td className="px-4 py-2">{formatHumanLabel(device.type)}</td>
                                        <td className="px-4 py-2 font-mono text-xs">{device.serial ?? '—'}</td>
                                        <td className="px-4 py-2">
                                            {device.approved_at ? (
                                                <IotRelativeTime iso={device.approved_at} />
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ConceptTableCard>
                ) : null}

                {authorizedZones.length > 0 ? (
                    <ConceptTableCard className="mt-4" title="Authorized zones" description="Access-controlled RFID areas">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Zone</th>
                                    <th className="px-4 py-2 font-medium">Type</th>
                                    <th className="px-4 py-2 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {authorizedZones.map((zone) => (
                                    <tr key={zone.id} className="border-b border-border/60">
                                        <td className="px-4 py-2">
                                            <p className="font-medium">{zone.name}</p>
                                            <p className="font-mono text-[10px] text-muted-foreground">{zone.code}</p>
                                        </td>
                                        <td className="px-4 py-2 text-xs">{formatHumanLabel(zone.zone_type)}</td>
                                        <td className="px-4 py-2 text-right">
                                            <IotViewLink href={zoneShow(zone.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ConceptTableCard>
                ) : null}

                {gateHistory.length > 0 ? (
                    <ConceptTableCard className="mt-4" title="Gate history" description="Recent entry / exit events">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Time</th>
                                    <th className="px-4 py-2 font-medium">Direction</th>
                                    <th className="px-4 py-2 font-medium">Reader</th>
                                    <th className="px-4 py-2 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {gateHistory.map((entry) => (
                                    <tr key={entry.id} className="border-b border-border/60">
                                        <td className="px-4 py-2">
                                            <IotRelativeTime iso={entry.occurred_at} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <IotHealthBadge status={entry.direction} />
                                        </td>
                                        <td className="px-4 py-2">
                                            {entry.gate_reader?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <IotViewLink href={gateLogShow(entry.id)} label="Details" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ConceptTableCard>
                ) : null}

                {lsrViolations.length > 0 ? (
                    <ConceptTableCard className="mt-4" title="LSR violations" description="Life-saving rule incidents involving this worker">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Category</th>
                                    <th className="px-4 py-2 font-medium">Mode</th>
                                    <th className="px-4 py-2 font-medium">Occurred</th>
                                    <th className="px-4 py-2 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {lsrViolations.map((violation) => (
                                    <tr key={violation.id} className="border-b border-border/60">
                                        <td className="px-4 py-2 font-medium">{violation.lsr_category}</td>
                                        <td className="px-4 py-2">
                                            <IotHealthBadge status={violation.detection_mode} />
                                        </td>
                                        <td className="px-4 py-2">
                                            <IotRelativeTime iso={violation.occurred_at} />
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <IotViewLink href={lsrShow(violation.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ConceptTableCard>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

RfidWorkerShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Workers', href: workersIndex() },
        { title: props.worker.full_name, href: workerShow(props.worker.id) },
    ],
});
