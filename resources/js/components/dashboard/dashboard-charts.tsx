import { Link } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { ConceptTableCard } from '@/components/concepts/concept-table-card';
import { IotEmptyState, IotHealthBadge, IotRelativeTime } from '@/components/iot/iot-ui';
import { formatHumanLabel, truncateLabel } from '@/lib/iot-format';
import { cn } from '@/lib/utils';
import { show as alertShow } from '@/routes/alerts';
import { index as alertsIndex } from '@/routes/alerts';
import { show as siteShow } from '@/routes/sites';

export type ModuleAlertStat = {
    module: string;
    key: string;
    count: number;
    color: string;
};

export type SeverityStat = {
    severity: string;
    count: number;
    color: string;
};

export type SiteHealthScore = {
    id: number;
    name: string;
    score: number;
    delta: number;
    open_alerts: number;
    cameras_online: number;
    cameras_total: number;
};

export type HeatmapCell = {
    day: string;
    hour: number;
    count: number;
};

export type CriticalAlert = {
    id: number;
    title: string;
    severity: string;
    site: string | null;
    camera: string | null;
    module_key: string | null;
    module_name: string | null;
    opened_at: string | null;
};

export type CameraAttention = {
    id: number;
    name: string;
    site: string | null;
    health_status: string;
    last_ingest_at: string | null;
};

export type RecentAlert = {
    id: number;
    title: string;
    severity: string;
    status: string;
    site: string | null;
    module_key: string | null;
    module_name: string | null;
    opened_at: string | null;
};

export type AlertStatusStat = {
    status: string;
    count: number;
    color: string;
};

function moduleBadgeLabel(alert: Pick<RecentAlert, 'module_key' | 'module_name' | 'severity'>): string {
    if (alert.module_name) {
        return truncateLabel(alert.module_name, 12);
    }

    if (alert.module_key) {
        return truncateLabel(formatHumanLabel(alert.module_key), 12);
    }

    return alert.severity;
}

function moduleBadgeClass(moduleKey: string | null): string {
    const palette: Record<string, string> = {
        ppe: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
        vehicle_proximity: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
        working_at_height: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
        rfid_ssms: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
        gas_monitoring: 'bg-red-500/15 text-red-600 dark:text-red-400',
        incident_vision: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    };

    return palette[moduleKey ?? ''] ?? 'bg-muted text-muted-foreground';
}

const CHART_TOOLTIP_STYLE = {
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
};

function heatmapColor(count: number, max: number): string {
    if (count === 0) {
        return 'hsl(var(--muted))';
    }

    const t = count / max;

    if (t < 0.25) {
        return `rgba(59, 130, 246, ${0.25 + t})`;
    }

    if (t < 0.6) {
        return `rgba(245, 158, 11, ${0.35 + t * 0.5})`;
    }

    return `rgba(239, 68, 68, ${0.45 + t * 0.5})`;
}

type AlertsByModuleChartProps = {
    data: ModuleAlertStat[];
};

export function AlertsByModuleChart({ data }: AlertsByModuleChartProps) {
    const chartData = data
        .filter((row) => row.count > 0)
        .map((row) => ({
            ...row,
            label: truncateLabel(row.module, 20),
        }));
    const total = chartData.reduce((sum, row) => sum + row.count, 0);

    return (
        <ConceptTableCard title="Alerts by module" description={`${total} alerts · last 7 days`}>
            {chartData.length === 0 ? (
                <IotEmptyState message="No alerts in the last 7 days" />
            ) : (
                <div className="h-52 p-3 pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis
                                type="category"
                                dataKey="label"
                                width={88}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip
                                contentStyle={CHART_TOOLTIP_STYLE}
                                formatter={(value: number) => [value, 'Alerts']}
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.module ?? ''}
                            />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.key} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ConceptTableCard>
    );
}

type SeverityDonutChartProps = {
    data: SeverityStat[];
};

export function SeverityDonutChart({ data }: SeverityDonutChartProps) {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    const active = data.filter((d) => d.count > 0);

    return (
        <ConceptTableCard title="Open by severity" description={`${total} in queue`}>
            <div className="relative h-52 p-3 pt-1">
                {total === 0 ? (
                    <IotEmptyState message="No open alerts" />
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={active}
                                    dataKey="count"
                                    nameKey="severity"
                                    cx="50%"
                                    cy="46%"
                                    innerRadius={52}
                                    outerRadius={76}
                                    paddingAngle={2}
                                    stroke="hsl(var(--card))"
                                    strokeWidth={2}
                                >
                                    {active.map((entry) => (
                                        <Cell key={entry.severity} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Legend verticalAlign="bottom" height={28} iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
                            <span className="text-2xl font-bold tabular-nums">{total}</span>
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">open</span>
                        </div>
                    </>
                )}
            </div>
        </ConceptTableCard>
    );
}

type AlertStatusChartProps = {
    data: AlertStatusStat[];
};

export function AlertStatusChart({ data }: AlertStatusChartProps) {
    const chartData = data
        .filter((row) => row.count > 0)
        .map((row) => ({
            ...row,
            label: formatHumanLabel(row.status),
        }));
    const total = data.reduce((sum, row) => sum + row.count, 0);

    return (
        <ConceptTableCard title="Alert workflow" description={`${total} opened · last 7 days`}>
            {chartData.length === 0 ? (
                <IotEmptyState message="No alert activity this week" />
            ) : (
                <div className="h-52 p-3 pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" horizontal={false} />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis
                                type="category"
                                dataKey="label"
                                width={88}
                                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                                {chartData.map((entry) => (
                                    <Cell key={entry.status} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </ConceptTableCard>
    );
}

type SiteHealthScoresProps = {
    sites: SiteHealthScore[];
};

function SiteHealthGauge({ score }: { score: number }) {
    const gaugeData = [{ name: 'score', value: score, fill: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444' }];

    return (
        <div className="h-16 w-16 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={8}
                    data={gaugeData}
                    startAngle={90}
                    endAngle={-270}
                >
                    <RadialBar background={{ fill: 'hsl(var(--muted))' }} dataKey="value" cornerRadius={4} />
                </RadialBarChart>
            </ResponsiveContainer>
            <span className="relative -top-10 block text-center text-sm font-bold tabular-nums">{score}</span>
        </div>
    );
}

export function SiteHealthScores({ sites }: SiteHealthScoresProps) {
    return (
        <ConceptTableCard title="Site health" description="Composite safety index · week over week">
            <ul className="divide-y">
                {sites.length === 0 ? (
                    <li className="p-4">
                        <IotEmptyState message="No sites in scope" />
                    </li>
                ) : (
                    sites.map((site) => (
                        <li key={site.id} className="flex gap-3 px-4 py-3">
                            <SiteHealthGauge score={site.score} />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <Link href={siteShow(site.id)} className="text-sm font-medium hover:underline">
                                        {site.name}
                                    </Link>
                                    <span
                                        className={cn(
                                            'text-[11px] font-semibold tabular-nums',
                                            site.delta >= 0 ? 'text-emerald-600' : 'text-destructive',
                                        )}
                                    >
                                        {site.delta >= 0 ? '↑' : '↓'}
                                        {Math.abs(site.delta)}
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all',
                                            site.score >= 80
                                                ? 'bg-emerald-500'
                                                : site.score >= 60
                                                  ? 'bg-amber-500'
                                                  : 'bg-destructive',
                                        )}
                                        style={{ width: `${site.score}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {site.open_alerts} open · {site.cameras_online}/{site.cameras_total} cameras
                                </p>
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </ConceptTableCard>
    );
}

type AlertHeatmapProps = {
    cells: HeatmapCell[];
    max: number;
};

export function AlertHeatmap({ cells, max }: AlertHeatmapProps) {
    const days = [...new Set(cells.map((cell) => cell.day))];
    const hours = Array.from({ length: 24 }, (_, hour) => hour);

    return (
        <ConceptTableCard title="Alert heatmap" description="Hour × day intensity (last 7 days)">
            <div className="space-y-3 p-4 pt-2">
                <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
                    <span>Low</span>
                    <div className="flex gap-0.5">
                        {[0.1, 0.35, 0.6, 0.9].map((t) => (
                            <div
                                key={t}
                                className="h-3 w-6 rounded-sm"
                                style={{ backgroundColor: heatmapColor(t * max, max) }}
                            />
                        ))}
                    </div>
                    <span>High</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                        <thead>
                            <tr>
                                <th className="w-10 p-1" />
                                {hours.map((hour) => (
                                    <th
                                        key={hour}
                                        className="p-0.5 text-center text-[9px] font-normal text-muted-foreground"
                                    >
                                        {hour % 4 === 0 ? hour : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {days.map((day) => (
                                <tr key={day}>
                                    <td className="pr-2 text-xs font-medium text-muted-foreground">{day}</td>
                                    {hours.map((hour) => {
                                        const cell = cells.find((c) => c.day === day && c.hour === hour);
                                        const count = cell?.count ?? 0;

                                        return (
                                            <td key={`${day}-${hour}`} className="p-0.5">
                                                <div
                                                    title={`${day} ${hour}:00 — ${count} alerts`}
                                                    className="h-5 w-full min-w-[10px] rounded-[3px] transition-transform hover:scale-110"
                                                    style={{
                                                        backgroundColor: heatmapColor(count, max),
                                                    }}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ConceptTableCard>
    );
}

type TrendDualLineChartProps = {
    labels: string[];
    events: number[];
    acknowledged: number[];
};

export function TrendDualLineChart({ labels, events, acknowledged }: TrendDualLineChartProps) {
    const data = labels.map((label, index) => ({
        label,
        events: events[index] ?? 0,
        acknowledged: acknowledged[index] ?? 0,
    }));
    const totalEvents = events.reduce((sum, n) => sum + n, 0);

    return (
        <ConceptTableCard title="Detection vs acknowledgement" description={`${totalEvents} events · 14 days`}>
            <div className="h-52 p-3 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 12, right: 16, left: -8, bottom: 0 }}>
                        <defs>
                            <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="ackGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                        <Area
                            type="monotone"
                            dataKey="events"
                            name="Events"
                            stroke="#3B82F6"
                            fill="url(#eventsGradient)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="acknowledged"
                            name="Acked"
                            stroke="#10B981"
                            fill="url(#ackGradient)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </ConceptTableCard>
    );
}

type CriticalAlertsStripProps = {
    alerts: CriticalAlert[];
};

export function CriticalAlertsStrip({ alerts }: CriticalAlertsStripProps) {
    return (
        <ConceptTableCard
            title="Critical now"
            description="High-priority open alerts"
            className="border-destructive/20 ring-1 ring-destructive/10"
        >
            <div className="flex items-center justify-end border-b border-border/60 bg-destructive/5 px-4 py-2">
                <Link href={alertsIndex()} className="text-sm font-medium text-primary hover:underline">
                    View all alerts →
                </Link>
            </div>
            {alerts.length === 0 ? (
                <p className="p-6 text-center text-sm text-emerald-600 dark:text-emerald-400">
                    No critical or high open alerts.
                </p>
            ) : (
                <ul className="divide-y">
                    {alerts.map((alert) => (
                        <li
                            key={alert.id}
                            className="flex items-center justify-between gap-4 border-l-4 border-destructive/60 bg-destructive/[0.03] p-4 pl-3"
                        >
                            <div className="min-w-0 space-y-1.5">
                                <p className="flex flex-wrap items-center gap-2 text-sm">
                                    <span
                                        className={cn(
                                            'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                                            moduleBadgeClass(alert.module_key),
                                        )}
                                    >
                                        {moduleBadgeLabel(alert)}
                                    </span>
                                    <Link
                                        href={alertShow(alert.id)}
                                        className="truncate font-medium hover:underline"
                                    >
                                        {alert.title}
                                    </Link>
                                </p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {[alert.site, alert.camera].filter(Boolean).join(' · ')} ·{' '}
                                    <IotRelativeTime iso={alert.opened_at} />
                                </p>
                            </div>
                            <ConceptStatusBadge
                                tone={alert.severity === 'critical' ? 'danger' : 'warning'}
                            >
                                {alert.severity}
                            </ConceptStatusBadge>
                        </li>
                    ))}
                </ul>
            )}
        </ConceptTableCard>
    );
}

type CamerasAttentionListProps = {
    cameras: CameraAttention[];
};

export function CamerasAttentionList({ cameras }: CamerasAttentionListProps) {
    return (
        <ConceptTableCard
            title="Cameras needing attention"
            description="Offline or degraded"
            className="border-amber-500/20 ring-1 ring-amber-500/10"
        >
            {cameras.length === 0 ? (
                <p className="p-6 text-center text-sm text-emerald-600 dark:text-emerald-400">
                    All cameras are healthy.
                </p>
            ) : (
                <ul className="divide-y">
                    {cameras.map((camera) => (
                        <li
                            key={camera.id}
                            className="flex items-center justify-between gap-4 border-l-4 border-amber-500/50 p-4 pl-3"
                        >
                            <div className="min-w-0">
                                <p className="font-medium">{camera.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {camera.site} · last ingest <IotRelativeTime iso={camera.last_ingest_at} />
                                </p>
                            </div>
                            <IotHealthBadge status={camera.health_status} />
                        </li>
                    ))}
                </ul>
            )}
        </ConceptTableCard>
    );
}

type RecentAlertsTableProps = {
    alerts: RecentAlert[];
};

export function RecentAlertsTable({ alerts }: RecentAlertsTableProps) {
    return (
        <ConceptTableCard title="Recent alerts" description="Latest activity across modules">
            <div className="flex items-center justify-end border-b border-border/60 px-4 py-2">
                <Link href={alertsIndex()} className="text-xs font-medium text-primary hover:underline">
                    View all →
                </Link>
            </div>
            {alerts.length === 0 ? (
                <IotEmptyState message="No alerts recorded yet" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Alert</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Module</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Severity</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-3 py-2 text-left font-medium text-muted-foreground">When</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {alerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-muted/20">
                                    <td className="max-w-[14rem] px-3 py-2">
                                        <Link
                                            href={alertShow(alert.id)}
                                            className="line-clamp-1 font-medium hover:underline"
                                        >
                                            {alert.title}
                                        </Link>
                                        {alert.site ? (
                                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                                {alert.site}
                                            </p>
                                        ) : null}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span
                                            className={cn(
                                                'inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                                                moduleBadgeClass(alert.module_key),
                                            )}
                                        >
                                            {moduleBadgeLabel(alert)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <ConceptStatusBadge
                                            tone={
                                                alert.severity === 'critical'
                                                    ? 'danger'
                                                    : alert.severity === 'high'
                                                      ? 'warning'
                                                      : 'muted'
                                            }
                                        >
                                            {alert.severity}
                                        </ConceptStatusBadge>
                                    </td>
                                    <td className="px-3 py-2">
                                        <IotHealthBadge status={alert.status} />
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                                        <IotRelativeTime iso={alert.opened_at} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ConceptTableCard>
    );
}
