import { Head } from '@inertiajs/react';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import {
    ConceptPageHeader,
    ConceptPageShell,
} from '@/components/concepts';
import { HorizontalCategoryChart, IotKpiStrip } from '@/components/iot/iot-charts';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as equipmentOverview } from '@/routes/iot/equipment';

type Props = {
    site: { id: number; name: string };
    summary: {
        total: number;
        active: number;
        vehicles: number;
        out_of_service: number;
    };
    analytics: {
        byType: { label: string; count: number }[];
        byStatus: { label: string; count: number }[];
    };
};

export default function EquipmentOverview({ site, summary, analytics }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Equipment — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Equipment registry"
                    description={`QR-labelled plant and vehicles for ${siteName} (IR4 §8.5)`}
                />

                <IotKpiStrip
                    kpis={[
                        { key: 'total', label: 'Registered', value: summary.total, hint: 'QR-labelled assets' },
                        { key: 'active', label: 'Active', value: summary.active, hint: 'In service' },
                        { key: 'vehicles', label: 'Vehicles', value: summary.vehicles, hint: 'Tracked fleet' },
                        { key: 'oos', label: 'Out of service', value: summary.out_of_service, hint: 'Maintenance hold' },
                    ]}
                />

                <IotModuleSection className="mt-4" title="Fleet analytics" description="Equipment mix and operational status">
                    <div className="grid gap-3 lg:grid-cols-2">
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
