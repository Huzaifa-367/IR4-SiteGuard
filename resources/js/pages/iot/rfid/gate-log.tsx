import { Head, Link } from '@inertiajs/react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
} from '@/components/concepts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { IotTimeRangeSelect, type IotTimeRangeFilters } from '@/components/iot/iot-time-range-select';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as gateLogIndex, show as gateLogShow } from '@/routes/iot/rfid/gate-log';
import { show as workerShow } from '@/routes/iot/rfid/workers';
import { IotViewLink } from '@/components/iot/iot-module-layout';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';

type GateLogRow = {
    id: number;
    tag_epc: string;
    worker_id: number | null;
    worker: string | null;
    direction: string;
    occurred_at: string;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
    site: { id: number; name: string };
    gateLog: Paginator<GateLogRow>;
    filters: IotTimeRangeFilters;
};

export default function RfidGateLog({ site, gateLog, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Gate log — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Gate entry / exit log"
                    description={`Gate passage events for ${siteName} — ${gateLog.total.toLocaleString()} in ${filters.label.toLowerCase()}`}
                >
                    <IotTimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Gate entry / exit log</h2>
                        <p className="text-sm text-muted-foreground">
                            Page {gateLog.current_page} of {gateLog.last_page} · {gateLog.total.toLocaleString()} events
                        </p>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Direction</TableHead>
                                <TableHead>Worker</TableHead>
                                <TableHead>Tag</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {gateLog.data.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell><IotRelativeTime iso={row.occurred_at} /></TableCell>
                                    <TableCell>
                                        <IotHealthBadge status={row.direction} />
                                    </TableCell>
                                    <TableCell>
                                        {row.worker_id ? (
                                            <Link href={workerShow(row.worker_id)} className="text-primary hover:underline">
                                                {row.worker ?? 'Unknown'}
                                            </Link>
                                        ) : (
                                            row.worker ?? 'Unknown'
                                        )}
                                    </TableCell>
                                    <TableCell className="font-mono text-[10px]">{row.tag_epc}</TableCell>
                                    <TableCell className="text-right">
                                        <IotViewLink href={gateLogShow(row.id)} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="px-4 pb-4">
                        <ConceptPagination links={gateLog.links} />
                    </div>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

RfidGateLog.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Gate log', href: gateLogIndex() },
    ],
});
