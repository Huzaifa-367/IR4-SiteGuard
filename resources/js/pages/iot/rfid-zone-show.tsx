import { Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotModuleSection,
    IotViewLink,
} from '@/components/iot/iot-module-layout';
import { ZonePositionMap } from '@/components/iot/zone-position-map';
import { IotHealthBadge, IotRelativeTime, IotUtilizationBar } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { useSiteContext } from '@/hooks/use-site-context';
import { show as fieldDeviceShow } from '@/routes/iot/field-devices';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as zonesIndex, show as zoneShow } from '@/routes/iot/rfid/zones';
import { show as workerShow } from '@/routes/iot/rfid/workers';

type Props = {
    site: { id: number; name: string };
    zone: {
        id: number;
        name: string;
        code: string;
        zone_type: string;
        max_occupancy: number | null;
        is_active: boolean;
        map_lat: number | null;
        map_lng: number | null;
        on_site_count: number;
    };
    siteMapCenter: { lat: number; lng: number } | null;
    readers: {
        id: number;
        name: string;
        code: string;
        mount_type: string;
        health_status: string;
        last_ingest_at: string | null;
    }[];
    authorizedWorkers: {
        id: number;
        full_name: string;
        contractor: string;
        role: string;
        tag_epc: string;
    }[];
    onSitePersonnel: {
        worker_id: number | null;
        tag_epc: string;
        worker: string | null;
        contractor: string | null;
        role: string | null;
        last_seen_at: string;
    }[];
};

export default function RfidZoneShow({
    site,
    zone,
    readers,
    authorizedWorkers,
    onSitePersonnel,
    siteMapCenter,
}: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const utilization =
        zone.max_occupancy && zone.max_occupancy > 0
            ? Math.round((zone.on_site_count / zone.max_occupancy) * 1000) / 10
            : null;

    return (
        <>
            <Head title={`${zone.name} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={zone.name}
                    description={`${zone.code} · ${formatHumanLabel(zone.zone_type)} · ${siteName}`}
                >
                    <Link href={zonesIndex()} className="text-sm text-primary hover:underline">
                        Back to zones
                    </Link>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="On site now"
                        value={zone.on_site_count}
                        sub={zone.max_occupancy ? `of ${zone.max_occupancy} max` : 'No occupancy cap'}
                    />
                    <IotDetailStat
                        label="Readers"
                        value={readers.length}
                        sub="Coverage points"
                    />
                    <IotDetailStat
                        label="Status"
                        value={<IotHealthBadge status={zone.is_active ? 'active' : 'inactive'} />}
                    />
                    <IotDetailStat
                        label="Authorized workers"
                        value={authorizedWorkers.length}
                        sub="Access list"
                    />
                </IotDetailStatGrid>

                {zone.max_occupancy ? (
                    <IotModuleSection title="Utilization" description="Live occupancy vs capacity" className="mb-4">
                        <div className="rounded-lg border border-border/80 bg-card p-4">
                            <IotUtilizationBar
                                value={zone.on_site_count}
                                max={zone.max_occupancy}
                                utilization={utilization}
                            />
                        </div>
                    </IotModuleSection>
                ) : null}

                <div className="grid gap-4 lg:grid-cols-2">
                    <ConceptTableCard title="RFID readers" description="Devices covering this zone">
                        {readers.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">No readers assigned to this zone.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">Reader</th>
                                        <th className="px-4 py-2 font-medium">Health</th>
                                        <th className="px-4 py-2 font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {readers.map((reader) => (
                                        <tr key={reader.id} className="border-b border-border/60">
                                            <td className="px-4 py-2">
                                                <p className="font-medium">{reader.name}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">{reader.code}</p>
                                            </td>
                                            <td className="px-4 py-2">
                                                <IotHealthBadge status={reader.health_status} />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <IotViewLink href={fieldDeviceShow({ type: 'rfid', id: reader.id })} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </ConceptTableCard>

                    <ConceptTableCard title="On-site personnel" description="Tags last seen in this zone">
                        {onSitePersonnel.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">No personnel currently in this zone.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="px-4 py-2 font-medium">Worker</th>
                                        <th className="px-4 py-2 font-medium">Last seen</th>
                                        <th className="px-4 py-2 font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {onSitePersonnel.map((person) => (
                                        <tr key={person.tag_epc} className="border-b border-border/60">
                                            <td className="px-4 py-2">
                                                <p className="font-medium">{person.worker ?? 'Unknown tag'}</p>
                                                {person.contractor ? (
                                                    <p className="text-xs text-muted-foreground">{person.contractor}</p>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-2">
                                                <IotRelativeTime iso={person.last_seen_at} />
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {person.worker_id ? (
                                                    <IotViewLink href={workerShow(person.worker_id)} />
                                                ) : null}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </ConceptTableCard>
                </div>

                {authorizedWorkers.length > 0 ? (
                    <ConceptTableCard className="mt-4" title="Authorized workers" description="Personnel permitted in this zone">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="px-4 py-2 font-medium">Name</th>
                                    <th className="px-4 py-2 font-medium">Contractor</th>
                                    <th className="px-4 py-2 font-medium">Role</th>
                                    <th className="px-4 py-2 font-medium" />
                                </tr>
                            </thead>
                            <tbody>
                                {authorizedWorkers.map((worker) => (
                                    <tr key={worker.id} className="border-b border-border/60">
                                        <td className="px-4 py-2 font-medium">{worker.full_name}</td>
                                        <td className="px-4 py-2">{worker.contractor}</td>
                                        <td className="px-4 py-2">{worker.role}</td>
                                        <td className="px-4 py-2 text-right">
                                            <IotViewLink href={workerShow(worker.id)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </ConceptTableCard>
                ) : null}

                {zone.map_lat !== null && zone.map_lng !== null ? (
                    <div className="mt-4">
                        <ZonePositionMap
                            mapCenter={siteMapCenter}
                            zones={[
                                {
                                    id: zone.id,
                                    name: zone.name,
                                    code: zone.code,
                                    zone_type: zone.zone_type,
                                    count: zone.on_site_count,
                                    lat: zone.map_lat,
                                    lng: zone.map_lng,
                                },
                            ]}
                        />
                    </div>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

RfidZoneShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Zones', href: zonesIndex() },
        { title: props.zone.name, href: zoneShow(props.zone.id) },
    ],
});
