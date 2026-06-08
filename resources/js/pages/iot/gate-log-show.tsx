import { Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    IotDetailStat,
    IotDetailStatGrid,
    IotLinkedResource,
    IotModuleSection,
} from '@/components/iot/iot-module-layout';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel } from '@/lib/iot-format';
import { useSiteContext } from '@/hooks/use-site-context';
import { show as fieldDeviceShow } from '@/routes/iot/field-devices';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as gateLogIndex, show as gateLogShow } from '@/routes/iot/rfid/gate-log';
import { show as workerShow } from '@/routes/iot/rfid/workers';

type Props = {
    site: { id: number; name: string };
    entry: {
        id: number;
        tag_epc: string;
        direction: string;
        occurred_at: string;
    };
    worker: {
        id: number;
        full_name: string;
        contractor: string;
        role: string;
        tag_epc: string;
    } | null;
    gateReader: {
        id: number;
        name: string;
        code: string;
        mount_type: string;
    } | null;
};

export default function GateLogShow({ site, entry, worker, gateReader }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Gate ${entry.direction} — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title={`Gate ${formatHumanLabel(entry.direction)}`}
                    description={`${siteName} · ${entry.tag_epc}`}
                >
                    <Link href={gateLogIndex()} className="text-sm text-primary hover:underline">
                        Back to gate log
                    </Link>
                </ConceptPageHeader>

                <IotDetailStatGrid className="mb-4">
                    <IotDetailStat
                        label="Occurred"
                        value={<IotRelativeTime iso={entry.occurred_at} />}
                    />
                    <IotDetailStat
                        label="Direction"
                        value={<IotHealthBadge status={entry.direction} />}
                    />
                    <IotDetailStat
                        label="Tag EPC"
                        value={<span className="font-mono text-xs">{entry.tag_epc}</span>}
                    />
                    <IotDetailStat
                        label="Worker"
                        value={worker?.full_name ?? 'Unregistered tag'}
                        sub={worker?.contractor}
                    />
                </IotDetailStatGrid>

                <IotModuleSection title="Traceability" description="Linked worker and gate reader">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {worker ? (
                            <IotLinkedResource
                                label="Registered worker"
                                href={workerShow(worker.id)}
                                hint={`${worker.full_name} · ${worker.role}`}
                            />
                        ) : (
                            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
                                Tag not linked to a worker record.
                            </div>
                        )}
                        {gateReader ? (
                            <IotLinkedResource
                                label="Gate reader"
                                href={fieldDeviceShow({ type: 'rfid', id: gateReader.id })}
                                hint={`${gateReader.name} (${gateReader.code})`}
                            />
                        ) : (
                            <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
                                No gate reader associated with this event.
                            </div>
                        )}
                    </div>
                </IotModuleSection>
            </ConceptPageShell>
        </>
    );
}

GateLogShow.layout = (props: Props) => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Gate log', href: gateLogIndex() },
        { title: `Event #${props.entry.id}`, href: gateLogShow(props.entry.id) },
    ],
});
