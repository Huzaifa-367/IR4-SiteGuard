import { Head, Link } from '@inertiajs/react';
import {
    AlertsByModuleChart,
    AlertHeatmap,
    CamerasAttentionList,
    CriticalAlertsStrip,
    SeverityDonutChart,
    SiteHealthScores,
    TrendDualLineChart,
    type CameraAttention,
    type CriticalAlert,
    type HeatmapCell,
    type ModuleAlertStat,
    type SeverityStat,
    type SiteHealthScore,
} from '@/components/dashboard/dashboard-charts';
import { DashboardKpiStrip, type DashboardKpi } from '@/components/dashboard/dashboard-kpi-strip';
import { ConceptPageHeader, ConceptPageShell } from '@/components/concepts';
import { dashboard } from '@/routes';
import { index as alertsIndex } from '@/routes/alerts';
import { index as reportsIndex } from '@/routes/reports';

type DashboardProps = {
    scopeLabel: string;
    updatedAt: string;
    kpis: DashboardKpi[];
    criticalAlerts: CriticalAlert[];
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
    alertsByModule,
    alertsBySeverity,
    siteHealthScores,
    alertHeatmap,
    camerasNeedingAttention,
    trend,
}: DashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <ConceptPageShell className="gap-6">
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

                <DashboardKpiStrip kpis={kpis} />

                <CriticalAlertsStrip alerts={criticalAlerts} />

                <div className="grid gap-4 xl:grid-cols-5">
                    <div className="xl:col-span-3">
                        <AlertsByModuleChart data={alertsByModule} />
                    </div>
                    <div className="xl:col-span-2">
                        <SeverityDonutChart data={alertsBySeverity} />
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <SiteHealthScores sites={siteHealthScores} />
                    <CamerasAttentionList cameras={camerasNeedingAttention} />
                </div>

                <AlertHeatmap cells={alertHeatmap.cells} max={alertHeatmap.max} />

                <TrendDualLineChart
                    labels={trend.labels}
                    events={trend.events}
                    acknowledged={trend.acknowledged}
                />
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
