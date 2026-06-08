import { Link } from '@inertiajs/react';
import {
    Co2TrendChart,
    DeviceHealthChart,
    GasMultiLineChart,
    GateFlowChart,
    IotActiveAlarmsList,
    IotKpiStrip,
    type Co2TrendData,
    type DeviceHealthRow,
    type GasTrendData,
    type GateFlowData,
    type IotKpi,
    type ZoneOccupancyRow,
    ZoneOccupancyChart,
} from '@/components/iot/iot-charts';
import { overview as equipmentOverview } from '@/routes/iot/equipment';
import { overview as fieldDevicesOverview } from '@/routes/iot/field-devices';
import { overview as gasOverview } from '@/routes/iot/gas';
import { overview as hseIncidentsOverview } from '@/routes/iot/hse-incidents';
import { overview as lsrOverview } from '@/routes/iot/lsr';
import { overview as rfidOverview } from '@/routes/iot/rfid';
import { index as udpmIndex } from '@/routes/iot/udpm';

export type IotDashboardSnapshot = {
    kpis: IotKpi[];
    gasTrend: GasTrendData | null;
    co2Trend: Co2TrendData | null;
    gateFlow: GateFlowData | null;
    zoneOccupancy: ZoneOccupancyRow[];
    deviceHealth: DeviceHealthRow[];
    activeAlarms: {
        parameter: string;
        value: number | string;
        threshold: number | string;
        severity: string;
        alarm_at: string;
    }[];
};

type DashboardIotSectionProps = {
    iot: IotDashboardSnapshot;
    rangeLabel?: string;
};

export function DashboardIotSection({ iot, rangeLabel = '90 days' }: DashboardIotSectionProps) {
    const hasGas = iot.gasTrend !== null || iot.co2Trend !== null;
    const hasRfid = iot.gateFlow !== null;

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-card to-card px-4 py-3">
                <p className="text-xs text-muted-foreground">
                    Live instrumented feeds from edge devices and gateways
                </p>
                <div className="flex flex-wrap gap-3 text-xs font-medium">
                    {hasRfid ? (
                        <Link href={rfidOverview()} className="text-primary hover:underline">
                            RFID / SSMS
                        </Link>
                    ) : null}
                    {hasGas ? (
                        <Link href={gasOverview()} className="text-primary hover:underline">
                            Gas & environmental
                        </Link>
                    ) : null}
                    <Link href={fieldDevicesOverview()} className="text-primary hover:underline">
                        Field devices
                    </Link>
                    <Link href={equipmentOverview()} className="text-primary hover:underline">
                        Equipment
                    </Link>
                    <Link href={hseIncidentsOverview()} className="text-primary hover:underline">
                        HSE
                    </Link>
                    <Link href={lsrOverview()} className="text-primary hover:underline">
                        LSR
                    </Link>
                    <Link href={udpmIndex()} className="text-primary hover:underline">
                        UDPM
                    </Link>
                </div>
            </div>

            <IotKpiStrip kpis={iot.kpis} />

            <div className="grid gap-3 lg:grid-cols-2">
                {iot.gateFlow ? (
                    <GateFlowChart data={iot.gateFlow} title={`Gate flow — ${rangeLabel}`} />
                ) : null}
                {iot.zoneOccupancy.length > 0 ? (
                    <ZoneOccupancyChart data={iot.zoneOccupancy} />
                ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {iot.gasTrend ? <GasMultiLineChart data={iot.gasTrend} /> : null}
                {iot.co2Trend ? <Co2TrendChart data={iot.co2Trend} /> : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <DeviceHealthChart data={iot.deviceHealth} />
                {iot.activeAlarms.length > 0 || hasGas ? (
                    <IotActiveAlarmsList alarms={iot.activeAlarms} gasHref={gasOverview()} />
                ) : null}
            </div>
        </div>
    );
}
