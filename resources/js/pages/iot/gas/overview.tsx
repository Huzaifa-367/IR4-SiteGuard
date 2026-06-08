import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { IotModuleSection } from '@/components/iot/iot-module-layout';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import {
    AlarmHistoryChart,
    Co2TrendChart,
    EnvironmentalTrendChart,
    GasMultiLineChart,
    GasThresholdsReference,
    IotKpiStrip,
    LelByGatewayChart,
    VehicleGasPanels,
    type Co2TrendData,
    type EnvironmentalTrendData,
    type GasTrendData,
} from '@/components/iot/iot-charts';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSiteContext } from '@/hooks/use-site-context';
import GasMonitoringController from '@/actions/App/Http/Controllers/GasMonitoringController';
import { overview as gasOverview } from '@/routes/iot/gas';

type Props = {
    site: { id: number; name: string };
    thresholds: Record<string, Record<string, number>>;
    permissions: { canManageThresholds: boolean };
    analytics: {
        summary: {
            max_lel: number | null;
            avg_co2: number | null;
            gateways_online: number;
            gateways_total: number;
        };
        gasTrend: GasTrendData;
        gasTrendDaily: GasTrendData;
        co2Trend: Co2TrendData;
        environmentalTrend: EnvironmentalTrendData;
        lelByGateway: {
            gateway: string;
            vehicle_label?: string | null;
            lel_pct: number | string | null;
            o2_pct?: number | string | null;
            h2s_ppm?: number | string | null;
            co_ppm?: number | string | null;
            alarm_state?: string | null;
        }[];
        alarmHistory: { labels: string[]; counts: number[] };
        thresholds: Record<string, Record<string, number>>;
    };
};

export default function GasOverview({ site, thresholds, analytics, permissions }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;
    const [thresholdsOpen, setThresholdsOpen] = useState(false);
    const lelHigh = thresholds.lel_pct?.high ?? analytics.thresholds.lel_pct?.high;
    const co2Warning = thresholds.co2_ppm?.warning ?? analytics.thresholds.co2_ppm?.warning;
    const lelThresholds = thresholds.lel_pct;
    const recentAlarms = analytics.alarmHistory.counts.reduce((sum, n) => sum + n, 0);

    return (
        <>
            <Head title={`Gas & environmental — ${siteName}`} />
            <ConceptPageShell className="gap-4">
                <ConceptPageHeader
                    title="Gas & environmental"
                    description={`Live 4-gas panels, CO₂, and RS485 sensors · ${siteName}`}
                >
                    {permissions.canManageThresholds ? (
                        <Dialog open={thresholdsOpen} onOpenChange={setThresholdsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline">Edit thresholds</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Gas alarm thresholds</DialogTitle></DialogHeader>
                                <Form
                                    {...GasMonitoringController.updateThresholds.form()}
                                    onSuccess={() => setThresholdsOpen(false)}
                                >
                                    {({ processing, errors }) => (
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="lel-high">LEL % high alarm</Label>
                                                <Input id="lel-high" name="lel_pct[high]" type="number" step="0.1" defaultValue={thresholds.lel_pct?.high} required />
                                                <InputError message={errors['lel_pct.high']} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <Label htmlFor="o2-low">O₂ % low</Label>
                                                    <Input id="o2-low" name="o2_pct[low]" type="number" step="0.1" defaultValue={thresholds.o2_pct?.low} required />
                                                    <InputError message={errors['o2_pct.low']} />
                                                </div>
                                                <div>
                                                    <Label htmlFor="o2-high">O₂ % high</Label>
                                                    <Input id="o2-high" name="o2_pct[high]" type="number" step="0.1" defaultValue={thresholds.o2_pct?.high} required />
                                                    <InputError message={errors['o2_pct.high']} />
                                                </div>
                                            </div>
                                            <div>
                                                <Label htmlFor="h2s-high">H₂S ppm high</Label>
                                                <Input id="h2s-high" name="h2s_ppm[high]" type="number" step="0.1" defaultValue={thresholds.h2s_ppm?.high} required />
                                                <InputError message={errors['h2s_ppm.high']} />
                                            </div>
                                            <div>
                                                <Label htmlFor="co-high">CO ppm high</Label>
                                                <Input id="co-high" name="co_ppm[high]" type="number" step="1" defaultValue={thresholds.co_ppm?.high} required />
                                                <InputError message={errors['co_ppm.high']} />
                                            </div>
                                            <Button type="submit" disabled={processing}>Save thresholds</Button>
                                        </div>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    ) : null}
                </ConceptPageHeader>

                <IotKpiStrip
                    className="mb-2"
                    kpis={[
                        {
                            key: 'lel',
                            label: 'Peak LEL',
                            value: analytics.summary.max_lel !== null ? `${analytics.summary.max_lel}%` : '—',
                            hint: lelHigh ? `Limit ${lelHigh}%` : '24h site max',
                            tone: analytics.summary.max_lel !== null && lelHigh && analytics.summary.max_lel >= lelHigh ? 'danger' : undefined,
                        },
                        {
                            key: 'co2',
                            label: 'Avg CO₂',
                            value: analytics.summary.avg_co2 !== null ? `${analytics.summary.avg_co2} ppm` : '—',
                            hint: 'Environmental sensors',
                        },
                        {
                            key: 'gateways',
                            label: 'Gateways online',
                            value: `${analytics.summary.gateways_online}/${analytics.summary.gateways_total}`,
                            hint: 'Vehicle 4-gas panels',
                        },
                        {
                            key: 'alarms',
                            label: 'Alarm events',
                            value: recentAlarms,
                            hint: '7-day threshold breaches',
                            tone: recentAlarms > 0 ? 'warning' : undefined,
                        },
                    ]}
                />

                <div className="space-y-4">
                    <IotModuleSection title="Live vehicle panels" description="Per-gateway LEL and alarm state">
                        <VehicleGasPanels gateways={analytics.lelByGateway} thresholds={lelThresholds} />
                    </IotModuleSection>
                    <IotModuleSection title="Trend analytics" description="Gas, CO₂, and environmental time series">
                        <div className="grid gap-3 lg:grid-cols-2">
                            <GasMultiLineChart data={analytics.gasTrend} lelThresholdHigh={lelHigh} />
                            <Co2TrendChart data={analytics.co2Trend} co2ThresholdWarning={co2Warning} />
                        </div>
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            <GasMultiLineChart
                                data={analytics.gasTrendDaily}
                                title="Gas — 7 day trend"
                                description="Daily site-wide averages"
                                lelThresholdHigh={lelHigh}
                            />
                            <EnvironmentalTrendChart data={analytics.environmentalTrend} />
                        </div>
                    </IotModuleSection>
                    <IotModuleSection title="Thresholds & alarm history" description="Configured limits and breach frequency">
                        <div className="grid gap-3 lg:grid-cols-2">
                            <LelByGatewayChart
                                data={analytics.lelByGateway.map((g) => ({ gateway: g.gateway, lel_pct: g.lel_pct }))}
                                thresholds={lelThresholds}
                            />
                            <AlarmHistoryChart labels={analytics.alarmHistory.labels} counts={analytics.alarmHistory.counts} />
                        </div>
                        <div className="mt-3">
                            <GasThresholdsReference thresholds={thresholds} />
                        </div>
                    </IotModuleSection>
                </div>
            </ConceptPageShell>
        </>
    );
}

GasOverview.layout = () => ({
    breadcrumbs: [{ title: 'Gas & environmental', href: gasOverview() }],
});
