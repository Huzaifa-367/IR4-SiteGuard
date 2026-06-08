import { Head, Link } from '@inertiajs/react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptTableCard,
} from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AlertSnapshot from '@/components/siteguard/alert-snapshot';
import { index as alertsIndex, show as alertShow } from '@/routes/alerts';

type AlertRow = {
    id: number;
    title: string;
    severity: string;
    status: string;
    opened_at: string;
    snapshot_url: string | null;
    site?: { id: number; name: string } | null;
    camera?: { id: number; name: string } | null;
    rule?: { id: number; name: string; code: string } | null;
};

type Paginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

type AlertsIndexProps = {
    alerts: Paginator<AlertRow>;
    filters: { status: string };
};

export default function AlertsIndex({ alerts }: AlertsIndexProps) {
    return (
        <>
            <Head title="Alerts" />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Alerts"
                    description="Safety alerts raised from detection rules."
                />
                <ConceptTableCard>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-16">Snapshot</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Camera</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Opened</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alerts.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-muted-foreground"
                                    >
                                        No alerts match your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                alerts.data.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell>
                                            <AlertSnapshot
                                                url={alert.snapshot_url}
                                                alt={alert.title}
                                                compact
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={alertShow(alert.id)}
                                                className="hover:underline"
                                            >
                                                {alert.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            {alert.site?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            {alert.camera?.name ?? '—'}
                                        </TableCell>
                                        <TableCell>
                                            <ConceptStatusBadge
                                                tone={
                                                    alert.severity ===
                                                        'critical' ||
                                                    alert.severity === 'high'
                                                        ? 'danger'
                                                        : 'warning'
                                                }
                                            >
                                                {alert.severity}
                                            </ConceptStatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <ConceptStatusBadge
                                                tone={
                                                    alert.status === 'open'
                                                        ? 'danger'
                                                        : 'neutral'
                                                }
                                            >
                                                {alert.status}
                                            </ConceptStatusBadge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {alert.opened_at}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ConceptTableCard>
            </ConceptPageShell>
        </>
    );
}

AlertsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alerts',
            href: alertsIndex(),
        },
    ],
};
