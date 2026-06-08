import { Head, Link, router } from '@inertiajs/react';
import { useCallback } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptTableCard,
} from '@/components/concepts';
import { EnumSelect, type EnumOption } from '@/components/siteguard/enum-select';
import { IotRelativeTime } from '@/components/iot/iot-ui';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { Button } from '@/components/ui/button';
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
import { show as siteShow } from '@/routes/sites';

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
    links: { url: string | null; label: string; active: boolean }[];
};

type AlertsIndexProps = {
    alerts: Paginator<AlertRow>;
    filters: { status: string };
    statusOptions: EnumOption[];
};

export default function AlertsIndex({ alerts, filters, statusOptions }: AlertsIndexProps) {
    const applyStatus = useCallback((status: string) => {
        router.get(
            alertsIndex({ query: status ? { status } : {} }),
            {},
            { preserveState: true, preserveScroll: true },
        );
    }, []);

    return (
        <>
            <Head title="Alerts" />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Alerts"
                    description="Safety alerts raised from detection rules."
                />
                <ConceptTableCard>
                    <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
                        <div className="min-w-[10rem]">
                            <label htmlFor="status-filter" className="mb-1 block text-xs text-muted-foreground">
                                Status
                            </label>
                            <EnumSelect
                                id="status-filter"
                                name="status"
                                options={[{ value: '', label: 'All statuses' }, ...statusOptions]}
                                defaultValue={filters.status}
                                className="h-8 text-xs"
                                placeholder="All statuses"
                            />
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const select = document.getElementById('status-filter') as HTMLSelectElement | null;
                                applyStatus(select?.value ?? '');
                            }}
                        >
                            Apply
                        </Button>
                    </div>
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
                                            {alert.site ? (
                                                <Link href={siteShow(alert.site.id)} className="hover:underline">
                                                    {alert.site.name}
                                                </Link>
                                            ) : (
                                                '—'
                                            )}
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
                                            <IotRelativeTime iso={alert.opened_at} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <ConceptPagination links={alerts.links} total={alerts.total} />
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
