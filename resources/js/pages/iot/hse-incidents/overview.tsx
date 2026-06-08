import { Head } from '@inertiajs/react';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    DailyCountChart,
    HorizontalCategoryChart,
    IotKpiStrip,
    type TimelineCountData,
} from '@/components/iot/iot-charts';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as hseOverview } from '@/routes/iot/hse-incidents';

type Props = {
    site: { id: number; name: string };
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
    };
};

export default function HseIncidentsOverview({ site, summary, analytics }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`HSE incidents — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="HSE incidents"
                    description={`Automated fall/stationary detection + formal classification for ${siteName} (IR4 §8.6)`}
                />
                <IotKpiStrip
                    kpis={[
                        { key: 'total', label: 'Total', value: summary.total, hint: 'All HSE incidents' },
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
                        <DailyCountChart data={analytics.timeline} title="Incidents — 14 days" color="#8B5CF6" />
                    </div>
                </IotModuleSection>
            </ConceptPageShell>
        </>
    );
}

HseIncidentsOverview.layout = () => ({
    breadcrumbs: [{ title: 'HSE incidents', href: hseOverview() }],
});
