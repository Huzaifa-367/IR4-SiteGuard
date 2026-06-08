import { Head, Link } from '@inertiajs/react';
import {
    AlertHeatmap,
    AlertsByModuleChart,
    AlertStatusChart,
    CamerasAttentionList,
    CriticalAlertsStrip,
    RecentAlertsTable,
    SeverityDonutChart,
    SiteHealthScores,
    TrendDualLineChart,
    type AlertStatusStat,
    type CameraAttention,
    type CriticalAlert,
    type HeatmapCell,
    type ModuleAlertStat,
    type RecentAlert,
    type SeverityStat,
    type SiteHealthScore,
} from '@/components/dashboard/dashboard-charts';
import {
    DashboardIotSection,
    type IotDashboardSnapshot,
} from '@/components/dashboard/dashboard-iot-section';
import { DashboardKpiStrip, type DashboardKpi } from '@/components/dashboard/dashboard-kpi-strip';
import {
    DashboardOperationsPulse,
    type OperationsPulseItem,
} from '@/components/dashboard/dashboard-operations-pulse';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import { dashboard } from '@/routes';
import { index as alertsIndex } from '@/routes/alerts';
import { index as reportsIndex } from '@/routes/reports';

type DashboardProps = {
    scopeLabel: string;
    updatedAt: string;
    kpis: DashboardKpi[];
    criticalAlerts: CriticalAlert[];
    recentAlerts: RecentAlert[];
    alertStatusBreakdown: AlertStatusStat[];
    operationsPulse: OperationsPulseItem[];
    alertsByModule: ModuleAlertStat[];
    alertsBySeverity: SeverityStat[];
    siteHealthScores: SiteHealthScore[];
    alertHeatmap: {
        days: string[];
        hours: number[];
        cells: HeatmapCell[];
        max: number;
    };
    camerasNeedingAttention: CameraAttention[];
    trend: {
        labels: string[];
        events: number[];
        acknowledged: number[];
    };
    iot: IotDashboardSnapshot | null;
};

function formatUpdatedAt(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Dashboard({
    scopeLabel,
    updatedAt,
    kpis,
    criticalAlerts,
    recentAlerts,
    alertStatusBreakdown,
    operationsPulse,
    alertsByModule,
    alertsBySeverity,
    siteHealthScores,
    alertHeatmap,
    camerasNeedingAttention,
    trend,
    iot,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <ConceptPageShell className="gap-5">
                <ConceptPageHeader
                    title="Safety posture"
                    description={`${scopeLabel} · Last 24h · Updated ${formatUpdatedAt(updatedAt)}`}
                >
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={reportsIndex()}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground"
                        >
                            Reports
                        </Link>
                        <Link
                            href={alertsIndex()}
                            className="text-sm font-medium text-primary hover:underline"
                        >
                            View all alerts
                        </Link>
                    </div>
                </ConceptPageHeader>

                {criticalAlerts.length > 0 ? (
                    <DashboardSection title="Requires attention" accent="danger">
                        <CriticalAlertsStrip alerts={criticalAlerts} />
                    </DashboardSection>
                ) : null}

                <DashboardKpiStrip kpis={kpis} />

                {operationsPulse.length > 0 ? (
                    <DashboardSection
                        title="Operations pulse"
                        description="Jump to queues that need follow-up"
                    >
                        <DashboardOperationsPulse items={operationsPulse} />
                    </DashboardSection>
                ) : null}

                <DashboardSection
                    title="Alert intelligence"
                    description="Volume, severity, workflow, and latest activity"
                    action={
                        <Link href={alertsIndex()} className="text-xs font-medium text-primary hover:underline">
                            Alert centre →
                        </Link>
                    }
                >
                    <div className="grid gap-3 lg:grid-cols-3">
                        <AlertsByModuleChart data={alertsByModule} />
                        <SeverityDonutChart data={alertsBySeverity} />
                        <AlertStatusChart data={alertStatusBreakdown} />
                    </div>
                    <RecentAlertsTable alerts={recentAlerts} />
                </DashboardSection>

                <DashboardSection
                    title="Site & camera health"
                    description="Composite scores and devices needing attention"
                >
                    <div className="grid gap-3 lg:grid-cols-2">
                        <SiteHealthScores sites={siteHealthScores} />
                        <CamerasAttentionList cameras={camerasNeedingAttention} />
                    </div>
                </DashboardSection>

                <DashboardSection
                    title="Activity patterns"
                    description="When alerts fire and how detection volume tracks acknowledgement"
                >
                    <div className="grid gap-3 xl:grid-cols-5">
                        <div className="xl:col-span-3">
                            <AlertHeatmap cells={alertHeatmap.cells} max={alertHeatmap.max} />
                        </div>
                        <div className="xl:col-span-2">
                            <TrendDualLineChart
                                labels={trend.labels}
                                events={trend.events}
                                acknowledged={trend.acknowledged}
                            />
                        </div>
                    </div>
                </DashboardSection>

                {iot !== null ? (
                    <DashboardSection
                        title="IoT & instrumented data"
                        description="RFID headcount, gas, environmental sensors — last 24h"
                        accent="iot"
                    >
                        <DashboardIotSection iot={iot} />
                    </DashboardSection>
                ) : null}
            </ConceptPageShell>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
