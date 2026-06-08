import { Head, Link, router } from '@inertiajs/react';
import { FileSpreadsheet } from 'lucide-react';
import { useCallback } from 'react';
import {
    ConceptPageHeader,
    ConceptPageShell,
    ConceptPagination,
    ConceptStatTiles,
    ConceptTableCard,
} from '@/components/concepts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { show as alertShow } from '@/routes/alerts';
import { index as reportsIndex } from '@/routes/reports';
import { exportMethod as exportAlerts } from '@/routes/reports/alerts';

type AlertRow = {
    id: number;
    title: string;
    severity: string;
    status: string;
    opened_at: string | null;
    site?: { id: number; name: string } | null;
    camera?: { id: number; name: string } | null;
    rule?: { id: number; name: string; code: string } | null;
};

type Paginator<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
};

type Props = {
    sites: { id: number; name: string; code: string | null }[];
    filters: { site_id: number | string; status: string };
    summary: {
        total: number;
        open: number;
        critical_high: number;
        acknowledged: number;
    };
    alerts: Paginator<AlertRow>;
};

function formatOpenedAt(value: string | null): string {
    if (value === null) {
        return '—';
    }

    return new Date(value).toLocaleString();
}

function buildExportUrl(filters: Props['filters']): string {
    const query: Record<string, string> = {};

    if (filters.site_id !== '' && filters.site_id !== null) {
        query.site_id = String(filters.site_id);
    }

    if (filters.status !== '') {
        query.status = filters.status;
    }

    return exportAlerts.url({ query });
}

export default function ReportsIndex({ sites, filters, summary, alerts }: Props) {
    const applyFilters = useCallback(
        (next: Partial<Props['filters']>) => {
            const siteId = next.site_id ?? filters.site_id;
            const status = next.status ?? filters.status;

            router.get(
                reportsIndex.url(),
                {
                    site_id: siteId === '' ? '' : siteId,
                    status: status === '' ? undefined : status,
                },
                { preserveState: true, replace: true, preserveScroll: true },
            );
        },
        [filters.site_id, filters.status],
    );

    const siteFilterValue =
        filters.site_id === '' || filters.site_id === null
            ? 'all'
            : String(filters.site_id);

    return (
        <>
            <Head title="Reports" />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Alert reports"
                    description="Review alert history for the selected scope. Export to Excel when you need a spreadsheet."
                >
                    <Button variant="outline" size="sm" asChild>
                        <a href={buildExportUrl(filters)}>
                            <FileSpreadsheet className="mr-1 size-4" />
                            Export to Excel
                        </a>
                    </Button>
                </ConceptPageHeader>

                <ConceptStatTiles
                    stats={[
                        { label: 'Total alerts', value: summary.total },
                        { label: 'Open', value: summary.open },
                        { label: 'Critical / high', value: summary.critical_high },
                        { label: 'Acknowledged', value: summary.acknowledged },
                    ]}
                />

                <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-card p-4 shadow-sm">
                    <div className="grid min-w-[180px] flex-1 gap-2">
                        <Label htmlFor="site_id">Site</Label>
                        <Select
                            value={siteFilterValue}
                            onValueChange={(value) =>
                                applyFilters({
                                    site_id: value === 'all' ? '' : Number(value),
                                })
                            }
                        >
                            <SelectTrigger id="site_id" className="h-10 w-full">
                                <SelectValue placeholder="All sites" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All sites</SelectItem>
                                {sites.map((site) => (
                                    <SelectItem key={site.id} value={String(site.id)}>
                                        {site.name}
                                        {site.code ? ` (${site.code})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid min-w-[160px] flex-1 gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={filters.status === '' ? 'any' : filters.status}
                            onValueChange={(value) =>
                                applyFilters({ status: value === 'any' ? '' : value })
                            }
                        >
                            <SelectTrigger id="status" className="h-10 w-full">
                                <SelectValue placeholder="Any status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                <SelectItem value="dismissed">Dismissed</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <ConceptTableCard
                    title="Alert data"
                    description={`${alerts.total} alert${alerts.total === 1 ? '' : 's'} matching your filters`}
                >
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Camera</TableHead>
                                <TableHead>Rule</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Opened</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alerts.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-muted-foreground">
                                        No alerts match your filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                alerts.data.map((alert) => (
                                    <TableRow key={alert.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={alertShow(alert.id)}
                                                className="hover:underline"
                                            >
                                                {alert.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{alert.site?.name ?? '—'}</TableCell>
                                        <TableCell>{alert.camera?.name ?? '—'}</TableCell>
                                        <TableCell>{alert.rule?.code ?? '—'}</TableCell>
                                        <TableCell>
                                            <ConceptStatusBadge
                                                tone={
                                                    alert.severity === 'critical' ||
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
                                                    alert.status === 'open' ? 'danger' : 'neutral'
                                                }
                                            >
                                                {alert.status}
                                            </ConceptStatusBadge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatOpenedAt(alert.opened_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <ConceptPagination links={alerts.links} />
                </ConceptTableCard>

                <p className="text-sm text-muted-foreground">
                    Use <span className="font-medium text-foreground">Export to Excel</span> above
                    to download the same filtered data as a spreadsheet.
                </p>
            </ConceptPageShell>
        </>
    );
}

ReportsIndex.layout = () => ({
    breadcrumbs: [{ title: 'Reports', href: reportsIndex() }],
});
