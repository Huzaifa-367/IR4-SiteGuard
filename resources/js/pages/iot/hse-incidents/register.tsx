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
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as hseOverview, show as hseShow } from '@/routes/iot/hse-incidents';
import { index as hseRegisterIndex } from '@/routes/iot/hse-incidents/register';

type IncidentRow = {
    id: number;
    incident_number: string;
    status: string;
    severity: string | null;
    incident_type: string | null;
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
    incidents: Paginator<IncidentRow>;
    filters: IotTimeRangeFilters;
};

export default function HseIncidentsRegister({ site, incidents, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Incident register — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Incident register"
                    description={`${incidents.total.toLocaleString()} incidents in ${filters.label.toLowerCase()} — ${siteName}`}
                >
                    <IotTimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <ConceptTableCard>
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">Incident register</h2>
                        <p className="text-xs text-muted-foreground">
                            Page {incidents.current_page} of {incidents.last_page}
                        </p>
                    </div>
                    <Table className="text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Occurred</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incidents.data.map((incident) => (
                                <TableRow key={incident.id}>
                                    <TableCell className="font-mono text-xs">
                                        {incident.incident_number}
                                    </TableCell>
                                    <TableCell><IotHealthBadge status={incident.status} /></TableCell>
                                    <TableCell>{incident.incident_type?.replace(/_/g, ' ') ?? '—'}</TableCell>
                                    <TableCell>
                                        {incident.severity ? <IotHealthBadge status={incident.severity} /> : '—'}
                                    </TableCell>
                                    <TableCell>
                                        <IotRelativeTime iso={incident.occurred_at} />
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={hseShow({ incident: incident.id })}
                                            className="text-sm text-primary hover:underline"
                                        >
                                            View
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="px-4 pb-4">
                        <ConceptPagination links={incidents.links} />
                    </div>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

HseIncidentsRegister.layout = () => ({
    breadcrumbs: [
        { title: 'HSE incidents', href: hseOverview() },
        { title: 'Register', href: hseRegisterIndex() },
    ],
});
