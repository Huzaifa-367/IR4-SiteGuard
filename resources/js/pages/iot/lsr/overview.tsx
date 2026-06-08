import { Head } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell, ConceptTableCard } from '@/components/concepts';
import {
    DailyCountChart,
    HorizontalCategoryChart,
    IotKpiStrip,
    ModeSplitChart,
    type TimelineCountData,
} from '@/components/iot/iot-charts';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    IotTimeRangeSelect,
    iotChartRangeLabel,
    type IotTimeRangeFilters,
} from '@/components/iot/iot-time-range-select';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as lsrOverview } from '@/routes/iot/lsr';

type Props = {
    site: { id: number; name: string };
    filters: IotTimeRangeFilters;
    summary: {
        total: number;
        automated: number;
        manual: number;
        missing_actions: number;
    };
    categoryBreakdown: { category: string; count: number }[];
    automatedCategories: { code: string; name: string; method: string }[];
    analytics: {
        timeline: TimelineCountData;
        chartDays: number;
    };
};

export default function LsrOverview({ site, summary, categoryBreakdown, automatedCategories, analytics, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const rangeLabel = iotChartRangeLabel(analytics.chartDays, filters.days);

    return (
        <>
            <Head title={`LSR log — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Life Saving Rules"
                    description={`Automated camera/RFID detection and manual permit workflows for ${siteName} (IR4 §8.6)`}
                >
                    <IotTimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <IotKpiStrip
                    kpis={[
                        { key: 'total', label: 'Total logs', value: summary.total, hint: rangeLabel },
                        { key: 'auto', label: 'Automated', value: summary.automated, hint: `Camera / RFID / gas · ${rangeLabel}` },
                        { key: 'manual', label: 'Manual', value: summary.manual, hint: `Permit workflows · ${rangeLabel}` },
                        {
                            key: 'actions',
                            label: 'Missing actions',
                            value: summary.missing_actions,
                            hint: 'UDPM §iii follow-up',
                            tone: summary.missing_actions > 0 ? 'warning' : undefined,
                        },
                    ]}
                />

                <div className="mt-4 space-y-4">
                    <IotModuleSection title="Detection analytics" description="Automated vs manual and category trends">
                        <div className="grid gap-3 lg:grid-cols-3">
                            <ModeSplitChart automated={summary.automated} manual={summary.manual} />
                            <HorizontalCategoryChart
                                title="By LSR category"
                                data={categoryBreakdown.map((row) => ({ label: row.category, count: row.count }))}
                                emptyMessage="No violations logged"
                            />
                            <DailyCountChart
                                data={analytics.timeline}
                                title={`Violations — ${rangeLabel}`}
                                description="LSR event volume over selected period"
                                color="#EF4444"
                            />
                        </div>
                    </IotModuleSection>
                    <ConceptTableCard className="mb-0">
                        <div className="border-b p-4">
                            <h2 className="font-semibold">Automated LSR categories (IR4 scope)</h2>
                            <p className="text-sm text-muted-foreground">Camera AI + RFID geofencing — no operator involvement required</p>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Detection</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {automatedCategories.map((c) => (
                                    <TableRow key={c.code}>
                                        <TableCell className="font-mono text-xs">{c.code}</TableCell>
                                        <TableCell>{c.name}</TableCell>
                                        <TableCell>{c.method}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ConceptTableCard>
                </div>
            </ConceptPageShell>
        </>
    );
}

LsrOverview.layout = () => ({
    breadcrumbs: [{ title: 'LSR log', href: lsrOverview() }],
});
