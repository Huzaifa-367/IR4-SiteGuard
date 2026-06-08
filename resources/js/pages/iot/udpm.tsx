import { Form, Head, Link } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import { HorizontalCategoryChart, IotKpiStrip } from '@/components/iot/iot-charts';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useSiteContext } from '@/hooks/use-site-context';
import UdpmReportController from '@/actions/App/Http/Controllers/UdpmReportController';
import { index as udpmIndex, show as udpmShow } from '@/routes/iot/udpm';

type Props = {
    site: { id: number; name: string };
    reports: {
        id: number;
        week_start: string;
        week_end: string;
        status: string;
        generated_at: string | null;
    }[];
    permissions: { canGenerate: boolean };
    analytics: {
        byStatus: { label: string; count: number }[];
        compliance: { sections: number; automated: number; manual: number; partial: number };
        reportCount: number;
    };
};

export default function UdpmReports({ site, reports, permissions, analytics }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`UDPM reports — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="UDPM weekly reports"
                    description={`UDPM-GM-0058 §6.5 compliance — 6 automated, 2 manual, 2 partial (IR4 §9)`}
                >
                    {permissions.canGenerate ? (
                        <Form {...UdpmReportController.generate.form()}>
                            {({ processing }) => (
                                <Button type="submit" disabled={processing}>
                                    Generate this week
                                </Button>
                            )}
                        </Form>
                    ) : null}
                </ConceptPageHeader>

                <IotKpiStrip
                    kpis={[
                        { key: 'sections', label: '§6.5 sections', value: analytics.compliance.sections, hint: 'UDPM-GM-0058 items' },
                        { key: 'auto', label: 'Automated', value: analytics.compliance.automated, hint: 'Fully automated sections' },
                        { key: 'manual', label: 'Manual', value: analytics.compliance.manual, hint: 'Manual workflow sections' },
                        { key: 'reports', label: 'Reports on file', value: analytics.reportCount, hint: 'Generated weekly reports' },
                    ]}
                />

                {analytics.byStatus.length > 0 ? (
                    <div className="mt-4">
                        <HorizontalCategoryChart
                            title="Reports by status"
                            data={analytics.byStatus}
                            valueLabel="Reports"
                        />
                    </div>
                ) : null}

                <ConceptTableCard className="mt-4">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold">Weekly reports</h2>
                        <p className="text-xs text-muted-foreground">UDPM-GM-0058 compliance archive</p>
                    </div>
                    <Table className="text-sm">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Week</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Generated</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>
                                        {r.week_start} — {r.week_end}
                                    </TableCell>
                                    <TableCell><IotHealthBadge status={r.status} /></TableCell>
                                    <TableCell>
                                        <IotRelativeTime iso={r.generated_at} />
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={udpmShow({ report: r.id })}
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

UdpmReports.layout = () => ({
    breadcrumbs: [{ title: 'UDPM reports', href: udpmIndex() }],
});
