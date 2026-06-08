import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
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

const MODULE_LABEL: Record<string, string> = {
    ppe: 'PPE',
    vehicle_proximity: 'VEH',
    working_at_height: 'HEIGHT',
};

const MODULE_BADGE_CLASS: Record<string, string> = {
    ppe: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    vehicle_proximity: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    working_at_height: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
};

const CHART_TOOLTIP_STYLE = {
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
};

function formatRelativeTime(iso: string | null): string {
    if (iso === null) {
        return '—';
    }

    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) {
        return 'just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 48) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
}

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
    return (
        <ConceptTableCard title="Alerts by module" description="Last 7 days — stacked volume">
            <div className="h-80 p-4 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
                        <XAxis dataKey="module" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56}>
                            {data.map((entry) => (
                                <Cell key={entry.key} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </ConceptTableCard>
    );
}

type SeverityDonutChartProps = {
    data: SeverityStat[];
};

export function SeverityDonutChart({ data }: SeverityDonutChartProps) {
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <ConceptTableCard title="Open alerts by severity" description="Current open queue">
            <div className="relative h-80 p-4 pt-2">
                {total === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No open alerts
                    </p>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.filter((d) => d.count > 0)}
                                    dataKey="count"
                                    nameKey="severity"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    stroke="hsl(var(--card))"
                                    strokeWidth={2}
                                >
                                    {data.map((entry) => (
                                        <Cell key={entry.severity} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
                            <span className="text-4xl font-bold tabular-nums">{total}</span>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">open</span>
                        </div>
                    </>
                )}
            </div>
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
        <ConceptTableCard title="Site health scores" description="Composite safety index">
            <ul className="divide-y">
                {sites.length === 0 ? (
                    <li className="p-4 text-sm text-muted-foreground">No sites in scope.</li>
                ) : (
                    sites.map((site) => (
                        <li key={site.id} className="flex gap-4 p-4">
                            <SiteHealthGauge score={site.score} />
                            <div className="min-w-0 flex-1 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Link href={siteShow(site.id)} className="font-medium hover:underline">
                                        {site.name}
                                    </Link>
                                    <span
                                        className={cn(
                                            'text-xs font-semibold tabular-nums',
                                            site.delta >= 0 ? 'text-emerald-600' : 'text-destructive',
                                        )}
                                    >
                                        {site.delta >= 0 ? '↑' : '↓'}
                                        {Math.abs(site.delta)}
                                    </span>
                                </div>
                                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
                                        style={{ width: `${site.score}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {site.open_alerts} open · {site.cameras_online}/{site.cameras_total} cameras
                                    online
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

    return (
        <ConceptTableCard title="Trend — events vs acknowledged" description="Last 14 days">
            <div className="h-80 p-4 pt-2">
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
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="events"
                            name="Detection events"
                            stroke="#3B82F6"
                            fill="url(#eventsGradient)"
                            strokeWidth={2.5}
                        />
                        <Area
                            type="monotone"
                            dataKey="acknowledged"
                            name="Acknowledged"
                            stroke="#10B981"
                            fill="url(#ackGradient)"
                            strokeWidth={2.5}
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
                                            MODULE_BADGE_CLASS[alert.module_key ?? ''] ??
                                                'bg-destructive/15 text-destructive',
                                        )}
                                    >
                                        {MODULE_LABEL[alert.module_key ?? ''] ??
                                            alert.module_name ??
                                            alert.severity}
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
                                    {formatRelativeTime(alert.opened_at)}
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
                                    {camera.site} · last ingest {formatRelativeTime(camera.last_ingest_at)}
                                </p>
                            </div>
                            <ConceptStatusBadge
                                tone={camera.health_status === 'offline' ? 'danger' : 'warning'}
                            >
                                {camera.health_status}
                            </ConceptStatusBadge>
                        </li>
                    ))}
                </ul>
            )}
        </ConceptTableCard>
    );
}
