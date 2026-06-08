import { Head } from '@inertiajs/react';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import {
    DeviceHealthChart,
    InventoryGaugeGrid,
    TokenSummaryStrip,
    type DeviceHealthRow,
    type InventoryGaugeRow,
} from '@/components/iot/iot-charts';
import {
    ConceptPageHeader,
    ConceptPageShell,
    TimeRangeSelect,
    type TimeRangeFilters,
} from '@/components/concepts';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as fieldDevicesOverview } from '@/routes/iot/field-devices';

type Props = {
    site: { id: number; name: string };
    filters: TimeRangeFilters;
    analytics: {
        chartDays: number;
        deviceHealth: DeviceHealthRow[];
        inventorySummary?: {
            edge: number;
            rfid: number;
            gas: number;
            sensors: number;
            expected_edge: number | null;
            expected_rfid: number | null;
            expected_gas: number | null;
            expected_sensors: number | null;
        };
        tokenSummary?: {
            issued: number;
            revoked: number;
            never_used: number;
            total_devices: number;
        };
    };
};

export default function FieldDevicesOverview({ site, analytics, filters }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Field devices — ${siteName}`} />
            <ConceptPageShell>
                <ConceptPageHeader
                    title="Field devices"
                    description={`Edge, RFID, gas, and sensor endpoints for ${siteName} (IR4 §7)`}
                >
                    <TimeRangeSelect filters={filters} />
                </ConceptPageHeader>

                <div className="space-y-4">
                    {analytics.inventorySummary ? (
                        <IotModuleSection title="Deployment inventory" description="Expected vs registered device counts">
                            <InventoryGaugeGrid
                                rows={[
                                    { key: 'edge', label: 'Edge devices', actual: analytics.inventorySummary.edge, expected: analytics.inventorySummary.expected_edge },
                                    { key: 'rfid', label: 'RFID readers', actual: analytics.inventorySummary.rfid, expected: analytics.inventorySummary.expected_rfid },
                                    { key: 'gas', label: 'Gas gateways', actual: analytics.inventorySummary.gas, expected: analytics.inventorySummary.expected_gas },
                                    { key: 'sensors', label: 'Sensors', actual: analytics.inventorySummary.sensors, expected: analytics.inventorySummary.expected_sensors },
                                ] satisfies InventoryGaugeRow[]}
                            />
                        </IotModuleSection>
                    ) : null}
                    {analytics.tokenSummary ? (
                        <IotModuleSection title="Ingest credentials" description="API token coverage across devices">
                            <TokenSummaryStrip
                                issued={analytics.tokenSummary.issued}
                                revoked={analytics.tokenSummary.revoked}
                                neverUsed={analytics.tokenSummary.never_used}
                                totalDevices={analytics.tokenSummary.total_devices}
                            />
                        </IotModuleSection>
                    ) : null}
                    <IotModuleSection title="Device health" description="Online vs degraded endpoints by type">
                        <DeviceHealthChart data={analytics.deviceHealth} />
                    </IotModuleSection>
                </div>
            </ConceptPageShell>
        </>
    );
}

FieldDevicesOverview.layout = () => ({
    breadcrumbs: [{ title: 'Field devices', href: fieldDevicesOverview() }],
});
