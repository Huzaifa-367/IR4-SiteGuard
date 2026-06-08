import { Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as hseOverview, show as hseShow } from '@/routes/iot/hse-incidents';
import { index as hseRegisterIndex } from '@/routes/iot/hse-incidents/register';

type Props = {
    site: { id: number; name: string };
    incidents: {
        id: number;
        incident_number: string;
        status: string;
        severity: string | null;
        incident_type: string | null;
        occurred_at: string;
    }[];
};

export default function HseIncidentsRegister({ site, incidents }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Incident register — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Incident register"
                    description={`Formal HSE incident classification for ${siteName}`}
                />

                <ConceptTableCard>
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">Incident register</h2>
                        <p className="text-xs text-muted-foreground">{incidents.length} recent incidents</p>
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
                            {incidents.map((incident) => (
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
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

HseIncidentsRegister.layout = () => ({
    breadcrumbs: [
        { title: 'HSE incidents', href: hseOverview() },
        { title: 'Incident register', href: hseRegisterIndex() },
    ],
});
