import { Head } from '@inertiajs/react';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import { CompactReadingsTable } from '@/components/iot/iot-charts';
import { IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { useSiteContext } from '@/hooks/use-site-context';
import { overview as gasOverview } from '@/routes/iot/gas';
import { index as gasReadingsIndex } from '@/routes/iot/gas/readings';

type GasLatest = {
    lel_pct: string | number;
    o2_pct: string | number;
    h2s_ppm: string | number;
    co_ppm: string | number;
    alarm_state: string;
    read_at: string;
};

type Props = {
    site: { id: number; name: string };
    gateways: {
        id: number;
        name: string;
        code: string;
        vehicle_label: string | null;
        health_status: string;
        latest: GasLatest | null;
    }[];
    sensors: {
        id: number;
        name: string;
        code: string;
        device_type: string;
        health_status: string;
        latest_co2_ppm: string | number | null;
        latest_temp_c: string | number | null;
        latest_humidity_pct: string | number | null;
        latest_wind_mps: string | number | null;
        read_at: string | null;
    }[];
    alarms: {
        id: number;
        parameter: string;
        value: string | number;
        threshold: string | number;
        severity: string;
        alarm_at: string;
    }[];
};

export default function GasReadings({ site, gateways, sensors, alarms }: Props) {
    const { selectedSite } = useSiteContext();
    const siteName = selectedSite?.name ?? site.name;

    return (
        <>
            <Head title={`Gas readings — ${siteName}`} />
            <ConceptPageShell className="gap-4">
                <ConceptPageHeader
                    title="All readings"
                    description={`Latest gas gateway, sensor, and alarm data for ${siteName}`}
                />

                <div className="space-y-3">
                    <div className="grid gap-3 lg:grid-cols-2">
                        <CompactReadingsTable
                            title="Gas gateways"
                            description="Latest 4-gas readings per vehicle gateway"
                            columns={['Gateway', 'Vehicle', 'Health', 'LEL', 'O₂', 'H₂S', 'CO', 'Alarm', 'Updated']}
                            rows={gateways.map((g) => [
                                <span key="name" className="font-medium">{g.name}<span className="ml-1 font-mono text-[10px] text-muted-foreground">{g.code}</span></span>,
                                g.vehicle_label ?? '—',
                                <IotHealthBadge key="health" status={g.health_status} />,
                                <span key="lel" className="tabular-nums font-medium">{g.latest?.lel_pct ?? '—'}%</span>,
                                <span key="o2" className="tabular-nums">{g.latest?.o2_pct ?? '—'}%</span>,
                                <span key="h2s" className="tabular-nums">{g.latest?.h2s_ppm ?? '—'}</span>,
                                <span key="co" className="tabular-nums">{g.latest?.co_ppm ?? '—'}</span>,
                                g.latest?.alarm_state ? <IotHealthBadge key="alarm" status={g.latest.alarm_state} /> : '—',
                                <IotRelativeTime key="read" iso={g.latest?.read_at} />,
                            ])}
                        />
                        <CompactReadingsTable
                            title="Environmental sensors"
                            description="CO₂, weather, and Modbus instruments"
                            columns={['Sensor', 'Type', 'Health', 'CO₂', 'Temp', 'Humidity', 'Wind', 'Updated']}
                            rows={sensors.map((s) => [
                                <span key="name" className="font-medium">{s.name}<span className="ml-1 font-mono text-[10px] text-muted-foreground">{s.code}</span></span>,
                                s.device_type,
                                <IotHealthBadge key="health" status={s.health_status} />,
                                <span key="co2" className="tabular-nums">{s.latest_co2_ppm ?? '—'} ppm</span>,
                                <span key="temp" className="tabular-nums">{s.latest_temp_c ?? '—'} °C</span>,
                                <span key="hum" className="tabular-nums">{s.latest_humidity_pct ?? '—'} %</span>,
                                <span key="wind" className="tabular-nums">{s.latest_wind_mps ?? '—'} m/s</span>,
                                <IotRelativeTime key="read" iso={s.read_at} />,
                            ])}
                        />
                    </div>

                    <CompactReadingsTable
                        title="Active alarms"
                        description={alarms.length > 0 ? `${alarms.length} threshold breach(es) requiring attention` : 'All parameters within limits'}
                        columns={['Parameter', 'Reading', 'Limit', 'Severity', 'Since']}
                        rows={alarms.map((a) => [
                            a.parameter,
                            <span key="val" className="tabular-nums font-medium">{a.value}</span>,
                            <span key="thr" className="tabular-nums text-muted-foreground">{a.threshold}</span>,
                            <IotHealthBadge key="sev" status={a.severity} />,
                            <IotRelativeTime key="at" iso={a.alarm_at} />,
                        ])}
                    />
                </div>
            </ConceptPageShell>
        </>
    );
}

GasReadings.layout = () => ({
    breadcrumbs: [
        { title: 'Gas & environmental', href: gasOverview() },
        { title: 'All readings', href: gasReadingsIndex() },
    ],
});
