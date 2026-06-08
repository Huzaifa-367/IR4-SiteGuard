import { Form, Head } from '@inertiajs/react';
import { Siren } from 'lucide-react';
import {
    ConceptPageHeader,
    ConceptPageShell,
} from '@/components/concepts';
import { Button } from '@/components/ui/button';
import { useSiteContext } from '@/hooks/use-site-context';
import RfidOperationsController from '@/actions/App/Http/Controllers/RfidOperationsController';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import {
    ContractorBreakdownChart,
    GateFlowChart,
    GateFlowHourlyChart,
    IotKpiStrip,
    ZoneOccupancyChart,
    ZonePositionMap,
    ZoneUtilizationPanel,
    type GateFlowData,
    type ZoneMapPin,
    type ZoneOccupancyRow,
} from '@/components/iot/iot-charts';
import { IotModuleSection } from '@/components/iot/iot-module-layout';

type Props = {
    site: { id: number; name: string };
    onSiteCount: number;
    permissions: { canEvacuate: boolean };
    analytics: {
        gateFlow: GateFlowData;
        gateFlowHourly: GateFlowData;
        zoneOccupancy: ZoneOccupancyRow[];
        contractorBreakdown: { contractor: string; count: number }[];
        rfidSummary: {
            on_site: number;
            stale_tags: number;
            stationary_tags: number;
            portable_approved: number;
            portable_pending: number;
        };
        zoneMapPins: ZoneMapPin[];
    };
};

export default function RfidOverview({ site, onSiteCount, permissions, analytics }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`RFID / SSMS — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="RFID / SSMS"
                    description={`Personnel tracking, gate operations, and evacuation for ${siteName} (IR4 §8.3)`}
                >
                    {permissions.canEvacuate ? (
                        <Form {...RfidOperationsController.generateEvacuation.form()}>
                            {({ processing }) => (
                                <Button type="submit" variant="destructive" disabled={processing}>
                                    <Siren className="mr-1 size-4" />
                                    Generate evacuation report
                                </Button>
                            )}
                        </Form>
                    ) : null}
                </ConceptPageHeader>

                <IotKpiStrip
                    kpis={[
                        { key: 'on-site', label: 'On site now', value: onSiteCount, hint: 'Live RFID headcount' },
                        { key: 'stale', label: 'Stale tags', value: analytics.rfidSummary.stale_tags, hint: 'No recent reader ping' },
                        { key: 'stationary', label: 'Stationary', value: analytics.rfidSummary.stationary_tags, hint: 'Dwell threshold exceeded' },
                        {
                            key: 'portable',
                            label: 'Portable GI',
                            value: `${analytics.rfidSummary.portable_approved}/${analytics.rfidSummary.portable_approved + analytics.rfidSummary.portable_pending}`,
                            hint: 'Approved device register',
                        },
                    ]}
                />

                <div className="mt-4 space-y-4">
                    <IotModuleSection title="Gate & zone analytics" description="Entry/exit flow and occupancy distribution">
                        <div className="grid gap-3 lg:grid-cols-2">
                            <GateFlowChart data={analytics.gateFlow} />
                            <GateFlowHourlyChart data={analytics.gateFlowHourly} />
                        </div>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <ZoneOccupancyChart data={analytics.zoneOccupancy} />
                            <ContractorBreakdownChart data={analytics.contractorBreakdown} />
                        </div>
                    </IotModuleSection>
                    <IotModuleSection title="Zone utilization map" description="Spatial view of reader coverage">
                        <ZoneUtilizationPanel data={analytics.zoneOccupancy} />
                        <div className="mt-3">
                            <ZonePositionMap zones={analytics.zoneMapPins} />
                        </div>
                    </IotModuleSection>
                </div>
            </ConceptPageShell>
        </>
    );
}

RfidOverview.layout = () => ({
    breadcrumbs: [{ title: 'RFID / SSMS', href: rfidOverview() }],
});
