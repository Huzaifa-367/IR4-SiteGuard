import { Head } from '@inertiajs/react';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import {
    ConceptPageHeader,
    ConceptPageShell,
} from '@/components/concepts';
import {
    DailyCountChart,
    HorizontalCategoryChart,
    IotKpiStrip,
    type TimelineCountData,
} from '@/components/iot/iot-charts';
import {
    TimeRangeSelect,
    iotChartRangeLabel,
    type TimeRangeFilters,
} from '@/components/concepts';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as equipmentOverview } from '@/routes/iot/equipment';

type Props = {
    site: { id: number; name: string };
    filters: TimeRangeFilters;
    summary: {
        total: number;
        active: number;
        vehicles: number;
        out_of_service: number;
    };
    analytics: {
        byType: { label: string; count: number }[];
        byStatus: { label: string; count: number }[];
        timeline: TimelineCountData;
        chartDays: number;
    };
};

export default function EquipmentOverview({ site, summary, analytics, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const rangeLabel = iotChartRangeLabel(analytics.chartDays, filters.days);

    return (
        <>
            <Head title={`Equipment — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Equipment registry"
                    description={`QR-labelled plant and vehicles for ${siteName} (IR4 §8.5)`}
                >
                    <TimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <IotKpiStrip
                    kpis={[
                        { key: 'total', label: 'Registered', value: summary.total, hint: rangeLabel },
                        { key: 'active', label: 'Active', value: summary.active, hint: 'In service' },
                        { key: 'vehicles', label: 'Vehicles', value: summary.vehicles, hint: 'Tracked fleet' },
                        { key: 'oos', label: 'Out of service', value: summary.out_of_service, hint: 'Maintenance hold' },
                    ]}
                />

                <IotModuleSection className="mt-4" title="Fleet analytics" description={`Equipment mix and inspections — ${rangeLabel}`}>
                    <div className="grid gap-3 lg:grid-cols-3">
                        <DailyCountChart
                            data={analytics.timeline}
                            title={`Inspections — ${rangeLabel}`}
                            description="Recorded equipment inspections"
                            color="#0EA5E9"
                        />
                        <HorizontalCategoryChart
                            title="By equipment type"
                            data={analytics.byType}
                            emptyMessage="No equipment registered"
                        />
                        <HorizontalCategoryChart
                            title="By status"
                            data={analytics.byStatus}
                            valueLabel="Assets"
                            emptyMessage="No equipment registered"
                        />
                    </div>
                </IotModuleSection>
            </ConceptPageShell>
        </>
    );
}

EquipmentOverview.layout = () => ({
    breadcrumbs: [{ title: 'Equipment', href: equipmentOverview() }],
});
