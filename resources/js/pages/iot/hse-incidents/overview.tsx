import { Head } from '@inertiajs/react';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    DailyCountChart,
    HorizontalCategoryChart,
    IotKpiStrip,
    type TimelineCountData,
} from '@/components/iot/iot-charts';
import {
    IotTimeRangeSelect,
    iotChartRangeLabel,
    type IotTimeRangeFilters,
} from '@/components/iot/iot-time-range-select';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as hseOverview } from '@/routes/iot/hse-incidents';

type Props = {
    site: { id: number; name: string };
    filters: IotTimeRangeFilters;
    summary: {
        total: number;
        pending: number;
        classified: number;
        critical: number;
    };
    analytics: {
        byType: { label: string; count: number }[];
        byStatus: { label: string; count: number }[];
        timeline: TimelineCountData;
        chartDays: number;
    };
};

export default function HseIncidentsOverview({ site, summary, analytics, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const rangeLabel = iotChartRangeLabel(analytics.chartDays, filters.days);

    return (
        <>
            <Head title={`HSE incidents — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="HSE incidents"
                    description={`Automated fall/stationary detection + formal classification for ${siteName} (IR4 §8.6)`}
                >
                    <IotTimeRangeSelect filters={filters} />
                </ConceptPageHeader>
                <IotKpiStrip
                    kpis={[
                        { key: 'total', label: 'Total', value: summary.total, hint: rangeLabel },
                        {
                            key: 'pending',
                            label: 'Pending',
                            value: summary.pending,
                            hint: 'Awaiting classification',
                            tone: summary.pending > 0 ? 'warning' : undefined,
                        },
                        { key: 'classified', label: 'Classified', value: summary.classified, hint: 'UDPM §ii ready' },
                        {
                            key: 'critical',
                            label: 'Critical',
                            value: summary.critical,
                            hint: 'High severity open',
                            tone: summary.critical > 0 ? 'danger' : undefined,
                        },
                    ]}
                />

                <IotModuleSection
                    className="mt-4"
                    title="Incident analytics"
                    description="Type, status, and volume trends"
                >
                    <div className="grid gap-3 lg:grid-cols-3">
                        <HorizontalCategoryChart title="By incident type" data={analytics.byType} emptyMessage="No incidents" />
                        <HorizontalCategoryChart title="By status" data={analytics.byStatus} valueLabel="Incidents" emptyMessage="No incidents" />
                        <DailyCountChart data={analytics.timeline} title={`Incidents — ${rangeLabel}`} color="#8B5CF6" />
                    </div>
                </IotModuleSection>
            </ConceptPageShell>
        </>
    );
}

HseIncidentsOverview.layout = () => ({
    breadcrumbs: [{ title: 'HSE incidents', href: hseOverview() }],
});
