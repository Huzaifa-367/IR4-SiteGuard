import { Head, Link } from '@inertiajs/react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
    TimeRangeSelect,
    type TimeRangeFilters,
} from '@/components/concepts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSiteContext } from '@/hooks/use-site-context';
import type { Paginator } from '@/types/pagination';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as personnelIndex } from '@/routes/iot/rfid/personnel';
import { show as workerShow } from '@/routes/iot/rfid/workers';
import { show as zoneShow } from '@/routes/iot/rfid/zones';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';

type PersonnelRow = {
    tag_epc: string;
    worker_id: number | null;
    worker: string | null;
    contractor: string | null;
    role: string | null;
    zone_id: number | null;
    zone: string | null;
    last_seen_at: string;
    is_stale: boolean;
    is_stationary: boolean;
};

type Props = {
    site: { id: number; name: string };
    onSiteCount: number;
    onSitePersonnel: Paginator<PersonnelRow>;
    filters: TimeRangeFilters;
};

export default function RfidPersonnel({ site, onSiteCount, onSitePersonnel, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`On-site personnel — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="On-site personnel"
                    description={`${onSiteCount} on site now · ${onSitePersonnel.total.toLocaleString()} in ${filters.label.toLowerCase()}`}
                >
                    <TimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">On-site personnel</h2>
                        <p className="text-xs text-muted-foreground">
                            Page {onSitePersonnel.current_page} of {onSitePersonnel.last_page}
                        </p>
                    </div>
                    {onSitePersonnel.data.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">No personnel match this filter.</p>
                    ) : (
                        <>
                            <Table className="text-sm">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Worker</TableHead>
                                        <TableHead>Zone</TableHead>
                                        <TableHead>Last seen</TableHead>
                                        <TableHead>Flags</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {onSitePersonnel.data.map((p) => (
                                        <TableRow key={p.tag_epc}>
                                            <TableCell>
                                                {p.worker_id ? (
                                                    <Link href={workerShow(p.worker_id)} className="font-medium text-primary hover:underline">
                                                        {p.worker ?? p.tag_epc}
                                                    </Link>
                                                ) : (
                                                    p.worker ?? p.tag_epc
                                                )}
                                                {p.contractor ? (
                                                    <p className="text-xs text-muted-foreground">{p.contractor}</p>
                                                ) : null}
                                            </TableCell>
                                            <TableCell>
                                                {p.zone_id ? (
                                                    <Link href={zoneShow(p.zone_id)} className="text-primary hover:underline">
                                                        {p.zone ?? '—'}
                                                    </Link>
                                                ) : (
                                                    p.zone ?? '—'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <IotRelativeTime iso={p.last_seen_at} />
                                            </TableCell>
                                            <TableCell className="flex gap-1">
                                                {p.is_stale ? <IotHealthBadge status="stale" /> : null}
                                                {p.is_stationary ? <IotHealthBadge status="stationary" /> : null}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="px-4 pb-4">
                                <ConceptPagination links={onSitePersonnel.links} />
                            </div>
                        </>
                    )}
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

RfidPersonnel.layout = () => ({
    breadcrumbs: [
        { title: 'RFID / SSMS', href: rfidOverview() },
        { title: 'Personnel', href: personnelIndex() },
    ],
});
