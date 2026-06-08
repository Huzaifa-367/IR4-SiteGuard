import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { ConceptTableCard } from '@/components/concepts/concept-table-card';
import { Card, CardContent } from '@/components/ui/card';
import {
    IotEmptyState,
    IotHealthBadge,
    IotInventoryGauge,
    IotMiniStat,
    IotUtilizationBar,
} from '@/components/iot/iot-ui';
import {
    CHART_PALETTE,
    formatHumanLabel,
    lelSeverityColor,
    paletteColor,
    truncateLabel,
    utilizationTone,
} from '@/lib/iot-format';
import { cn } from '@/lib/utils';

const CHART_TOOLTIP_STYLE = {
    borderRadius: '8px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--card))',
    fontSize: '12px',
};

const CHART_HEIGHT = 'h-52';
const CHART_HEIGHT_TALL = 'h-60';

function IotChartCard({
    title,
    description,
    children,
    className,
    action,
    tall,
}: {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
    tall?: boolean;
}) {
    return (
        <ConceptTableCard title={title} description={description} className={className}>
            {action ? (
                <div className="flex justify-end border-b border-border/60 px-4 py-2">{action}</div>
            ) : null}
            <div className={cn(tall ? CHART_HEIGHT_TALL : CHART_HEIGHT, 'p-3 pt-1')}>{children}</div>
        </ConceptTableCard>
    );
}

export type IotKpi = {
    key: string;
    label: string;
    value: string | number;
    hint: string;
    href?: string;
    tone?: 'success' | 'warning' | 'danger';
};

export type GasTrendData = {
    labels: string[];
    lel: (number | null)[];
    o2: (number | null)[];
    h2s: (number | null)[];
    co: (number | null)[];
};

export type Co2TrendData = {
    labels: string[];
    values: (number | null)[];
};

export type GateFlowData = {
    labels: string[];
    entries: number[];
    exits: number[];
};

export type ZoneOccupancyRow = {
    zone: string;
    count: number;
    max: number | null;
    utilization: number | null;
};

export type DeviceHealthRow = {
    type: string;
    online: number;
    offline: number;
    degraded: number;
    total: number;
};

export type CategoryCountRow = {
    label: string;
    count: number;
};

export type TimelineCountData = {
    labels: string[];
    values: number[];
};

export type InventoryGaugeRow = {
    key: string;
    label: string;
    actual: number;
    expected: number | null;
};

type IotKpiStripProps = {
    kpis: IotKpi[];
    className?: string;
};

export function IotKpiStrip({ kpis, className }: IotKpiStripProps) {
    if (kpis.length === 0) {
        return null;
    }

    return (
        <div className={cn('grid gap-2 sm:grid-cols-2 xl:grid-cols-4', className)}>
            {kpis.map((kpi) => {
                const stat = (
                    <IotMiniStat
                        label={kpi.label}
                        value={kpi.value}
                        sub={kpi.hint}
                        tone={kpi.tone}
                    />
                );

                if (!kpi.href) {
                    return <div key={kpi.key}>{stat}</div>;
                }

                return (
                    <Link
                        key={kpi.key}
                        href={kpi.href}
                        className="group block rounded-lg transition-shadow hover:ring-1 hover:ring-primary/25"
                    >
                        {stat}
                    </Link>
                );
            })}
        </div>
    );
}

type GasMultiLineChartProps = {
    data: GasTrendData;
    title?: string;
    description?: string;
    lelThresholdHigh?: number | null;
};

export function GasMultiLineChart({
    data,
    title = 'Gas readings — 24h',
    description = 'Site-wide hourly averages (LEL, O₂, H₂S, CO)',
    lelThresholdHigh,
}: GasMultiLineChartProps) {
    const chartData = data.labels.map((label, i) => ({
        label,
        lel: data.lel[i],
        o2: data.o2[i],
        h2s: data.h2s[i],
        co: data.co[i],
    }));

    const hasData = chartData.some((row) => row.lel !== null || row.o2 !== null);

    return (
        <IotChartCard title={title} description={description}>
            {!hasData ? (
                <IotEmptyState message="No gas readings in the selected window" />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={36} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {lelThresholdHigh !== null && lelThresholdHigh !== undefined ? (
                            <ReferenceLine y={lelThresholdHigh} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'LEL high', fontSize: 10, fill: '#EF4444' }} />
                        ) : null}
                        <Line type="monotone" dataKey="lel" name="LEL %" stroke="#EF4444" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="o2" name="O₂ %" stroke="#3B82F6" strokeWidth={1.5} dot={false} connectNulls />
                        <Line type="monotone" dataKey="h2s" name="H₂S ppm" stroke="#F59E0B" strokeWidth={1.5} dot={false} connectNulls />
                        <Line type="monotone" dataKey="co" name="CO ppm" stroke="#8B5CF6" strokeWidth={1.5} dot={false} connectNulls />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </IotChartCard>
    );
}

type Co2TrendChartProps = {
    data: Co2TrendData;
    title?: string;
    co2ThresholdWarning?: number | null;
};

export function Co2TrendChart({
    data,
    title = 'CO₂ trend — 24h',
    co2ThresholdWarning,
}: Co2TrendChartProps) {
    const chartData = data.labels.map((label, i) => ({ label, co2: data.values[i] }));
    const hasData = chartData.some((row) => row.co2 !== null);

    return (
        <IotChartCard title={title} description="Hourly average CO₂ (ppm)">
            {!hasData ? (
                <IotEmptyState message="No CO₂ readings in the selected window" />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <defs>
                            <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={40} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        {co2ThresholdWarning !== null && co2ThresholdWarning !== undefined ? (
                            <ReferenceLine y={co2ThresholdWarning} stroke="#F59E0B" strokeDasharray="4 4" />
                        ) : null}
                        <Area type="monotone" dataKey="co2" name="CO₂ ppm" stroke="#22C55E" fill="url(#co2Gradient)" strokeWidth={2} connectNulls />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </IotChartCard>
    );
}

type GateFlowChartProps = {
    data: GateFlowData;
    title?: string;
    description?: string;
};

export function GateFlowChart({
    data,
    title = 'Gate flow',
    description = 'Daily entries vs exits',
}: GateFlowChartProps) {
    const chartData = data.labels.map((label, i) => ({
        label,
        entries: data.entries[i] ?? 0,
        exits: data.exits[i] ?? 0,
        net: (data.entries[i] ?? 0) - (data.exits[i] ?? 0),
    }));

    const totalIn = chartData.reduce((sum, row) => sum + row.entries, 0);
    const totalOut = chartData.reduce((sum, row) => sum + row.exits, 0);

    return (
        <IotChartCard
            title={title}
            description={`${description} · ${totalIn} in / ${totalOut} out`}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="entries" name="Entry" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="exits" name="Exit" fill="#64748B" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
            </ResponsiveContainer>
        </IotChartCard>
    );
}

type ZoneOccupancyChartProps = {
    data: ZoneOccupancyRow[];
};

export function ZoneOccupancyChart({ data }: ZoneOccupancyChartProps) {
    const chartData = data.map((row) => ({
        zone: truncateLabel(row.zone, 14),
        count: row.count,
        max: row.max,
        utilization: row.utilization,
    }));

    return (
        <IotChartCard title="Zone occupancy" description="On-site count vs configured limits">
            {chartData.length === 0 ? (
                <IotEmptyState message="No zones configured" />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="zone" width={88} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={CHART_TOOLTIP_STYLE}
                            formatter={(value: number, _name, item) => {
                                const payload = item.payload as { max: number | null; utilization: number | null };
                                const maxLabel = payload.max !== null ? ` / ${payload.max} max` : '';
                                const utilLabel = payload.utilization !== null ? ` (${payload.utilization}%)` : '';

                                return [`${value}${maxLabel}${utilLabel}`, 'On site'];
                            }}
                        />
                        <Bar dataKey="count" name="On site" radius={[0, 4, 4, 0]} maxBarSize={20}>
                            {chartData.map((entry) => {
                                const tone = utilizationTone(entry.utilization);
                                const fill = tone === 'danger' ? '#EF4444' : tone === 'warning' ? '#F59E0B' : '#06B6D4';

                                return <Cell key={entry.zone} fill={fill} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </IotChartCard>
    );
}

export function ZoneUtilizationPanel({ data }: { data: ZoneOccupancyRow[] }) {
    if (data.length === 0) {
        return null;
    }

    return (
        <ConceptTableCard title="Zone utilization" description="Live headcount against limits">
            <div className="divide-y">
                {data.map((row) => (
                    <div key={row.zone} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center">
                        <div>
                            <p className="text-sm font-medium leading-tight">{row.zone}</p>
                            {row.utilization !== null && row.utilization >= 100 ? (
                                <p className="text-[11px] text-destructive">Over capacity</p>
                            ) : null}
                        </div>
                        <IotUtilizationBar value={row.count} max={row.max} utilization={row.utilization} />
                    </div>
                ))}
            </div>
        </ConceptTableCard>
    );
}

type DeviceHealthChartProps = {
    data: DeviceHealthRow[];
};

export function DeviceHealthChart({ data }: DeviceHealthChartProps) {
    const chartData = data.map((row) => ({
        type: truncateLabel(row.type, 12),
        online: row.online,
        offline: row.offline + row.degraded,
        onlinePct: row.total > 0 ? Math.round((row.online / row.total) * 100) : 0,
    }));

    return (
        <IotChartCard title="Device health" description="Online vs offline by device family">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                    <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value: number, name: string, item) => {
                            if (name === 'Online') {
                                const pct = (item.payload as { onlinePct: number }).onlinePct;

                                return [`${value} (${pct}%)`, name];
                            }

                            return [value, name];
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="online" name="Online" stackId="a" fill="#10B981" />
                    <Bar dataKey="offline" name="Offline / degraded" stackId="a" fill="#EF4444" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </IotChartCard>
    );
}

type LelByGatewayChartProps = {
    data: { gateway: string; lel_pct: number | string | null }[];
    thresholds?: { low?: number; high?: number };
};

export function LelByGatewayChart({ data, thresholds }: LelByGatewayChartProps) {
    const chartData = data.map((row) => ({
        gateway: truncateLabel(row.gateway, 14),
        lel: row.lel_pct !== null ? Number(row.lel_pct) : 0,
    }));

    return (
        <IotChartCard title="Latest LEL by gateway" description="Current LEL % per gas gateway">
            {chartData.length === 0 ? (
                <IotEmptyState message="No gas gateways registered" />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                        <XAxis dataKey="gateway" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={32} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        {thresholds?.high !== undefined ? (
                            <ReferenceLine y={thresholds.high} stroke="#EF4444" strokeDasharray="4 4" />
                        ) : null}
                        <Bar dataKey="lel" name="LEL %" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry) => (
                                <Cell key={entry.gateway} fill={lelSeverityColor(entry.lel, thresholds)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </IotChartCard>
    );
}

type AlarmHistoryChartProps = {
    labels: string[];
    counts: number[];
};

export function AlarmHistoryChart({ labels, counts }: AlarmHistoryChartProps) {
    const chartData = labels.map((label, i) => ({ label, count: counts[i] ?? 0 }));
    const peak = Math.max(...chartData.map((row) => row.count), 0);

    return (
        <IotChartCard title="Sensor alarms — 7 days" description={peak > 0 ? `Peak ${peak} alarms/day` : 'Daily alarm events'}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar dataKey="count" name="Alarms" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
            </ResponsiveContainer>
        </IotChartCard>
    );
}

type ContractorBreakdownChartProps = {
    data: { contractor: string; count: number }[];
};

export function ContractorBreakdownChart({ data }: ContractorBreakdownChartProps) {
    return (
        <HorizontalCategoryChart
            title="Workers by contractor"
            description="Active registered workers"
            data={data.map((row) => ({ label: row.contractor, count: row.count }))}
            emptyMessage="No workers registered"
        />
    );
}

type HorizontalCategoryChartProps = {
    title: string;
    description?: string;
    data: CategoryCountRow[];
    emptyMessage?: string;
    valueLabel?: string;
};

export function HorizontalCategoryChart({
    title,
    description,
    data,
    emptyMessage = 'No data',
    valueLabel = 'Count',
}: HorizontalCategoryChartProps) {
    const chartData = data.map((row) => ({
        label: truncateLabel(row.label, 22),
        fullLabel: row.label,
        count: row.count,
    }));

    return (
        <IotChartCard title={title} description={description}>
            {chartData.length === 0 ? (
                <IotEmptyState message={emptyMessage} />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                            contentStyle={CHART_TOOLTIP_STYLE}
                            labelFormatter={(_label, payload) => {
                                const row = payload?.[0]?.payload as { fullLabel?: string } | undefined;

                                return row?.fullLabel ?? _label;
                            }}
                        />
                        <Bar dataKey="count" name={valueLabel} radius={[0, 4, 4, 0]} maxBarSize={18}>
                            {chartData.map((entry, i) => (
                                <Cell key={entry.fullLabel} fill={paletteColor(i)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </IotChartCard>
    );
}

export function DailyCountChart({
    data,
    title,
    description,
    color = CHART_PALETTE[0],
}: {
    data: TimelineCountData;
    title: string;
    description?: string;
    color?: string;
}) {
    const chartData = data.labels.map((label, i) => ({ label, count: data.values[i] ?? 0 }));
    const total = chartData.reduce((sum, row) => sum + row.count, 0);

    return (
        <IotChartCard title={title} description={description ?? `${total} total in period`}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="count" name="Events" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
            </ResponsiveContainer>
        </IotChartCard>
    );
}

export function ModeSplitChart({
    automated,
    manual,
    title = 'Detection mode',
    description,
}: {
    automated: number;
    manual: number;
    title?: string;
    description?: string;
}) {
    const chartData = [
        { mode: 'Automated', count: automated, fill: '#10B981' },
        { mode: 'Manual', count: manual, fill: '#F59E0B' },
    ].filter((row) => row.count > 0);

    return (
        <IotChartCard title={title} description={description ?? `${automated + manual} total events`}>
            {chartData.length === 0 ? (
                <IotEmptyState message="No events logged" />
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                        <XAxis dataKey="mode" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="count" name="Events" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {chartData.map((entry) => (
                                <Cell key={entry.mode} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
        </IotChartCard>
    );
}

export function InventoryGaugeGrid({ rows }: { rows: InventoryGaugeRow[] }) {
    if (rows.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((row) => (
                <IotInventoryGauge
                    key={row.key}
                    label={row.label}
                    actual={row.actual}
                    expected={row.expected}
                />
            ))}
        </div>
    );
}

export function TokenSummaryStrip({
    issued,
    revoked,
    neverUsed,
    totalDevices,
}: {
    issued: number;
    revoked: number;
    neverUsed: number;
    totalDevices: number;
}) {
    const coverage = totalDevices > 0 ? Math.round((issued / totalDevices) * 100) : 0;

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <IotMiniStat label="Tokens issued" value={`${issued}/${totalDevices}`} sub={`${coverage}% coverage`} />
            <IotMiniStat label="Never used" value={neverUsed} sub="Awaiting first ingest" tone={neverUsed > 0 ? 'warning' : 'success'} />
            <IotMiniStat label="Revoked" value={revoked} tone={revoked > 0 ? 'warning' : undefined} />
            <IotMiniStat label="Field endpoints" value={totalDevices} sub="Edge, RFID, gas, sensors" />
        </div>
    );
}

type GasSummaryProps = {
    summary: {
        max_lel: number | null;
        avg_co2: number | null;
        gateways_online: number;
        gateways_total: number;
    };
    lelThresholdHigh?: number | null;
};

export function GasSummaryGrid({ summary, lelThresholdHigh }: GasSummaryProps) {
    const lelTone =
        summary.max_lel !== null && lelThresholdHigh !== null && lelThresholdHigh !== undefined && summary.max_lel >= lelThresholdHigh
            ? 'danger'
            : undefined;

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <IotMiniStat
                label="Max LEL (24h)"
                value={summary.max_lel !== null ? `${summary.max_lel}%` : '—'}
                tone={lelTone}
            />
            <IotMiniStat label="Avg CO₂ (24h)" value={summary.avg_co2 !== null ? `${summary.avg_co2} ppm` : '—'} />
            <IotMiniStat
                label="Gas gateways"
                value={`${summary.gateways_online} / ${summary.gateways_total}`}
                sub="Online now"
                tone={
                    summary.gateways_total > 0 && summary.gateways_online < summary.gateways_total
                        ? 'warning'
                        : 'success'
                }
            />
            <IotMiniStat
                label="Fleet status"
                value={
                    summary.gateways_total === 0
                        ? '—'
                        : summary.gateways_online === summary.gateways_total
                          ? 'All online'
                          : 'Partial'
                }
                tone={
                    summary.gateways_total === 0
                        ? undefined
                        : summary.gateways_online === summary.gateways_total
                          ? 'success'
                          : 'warning'
                }
            />
        </div>
    );
}

type IotActiveAlarmsListProps = {
    alarms: {
        parameter: string;
        value: number | string;
        threshold: number | string;
        severity: string;
        alarm_at: string;
    }[];
    gasHref?: string;
};

export function IotActiveAlarmsList({ alarms, gasHref }: IotActiveAlarmsListProps) {
    return (
        <ConceptTableCard
            title="Active sensor alarms"
            description="Gas & environmental thresholds"
            className={alarms.length > 0 ? 'border-destructive/20 ring-1 ring-destructive/10' : undefined}
        >
            {gasHref ? (
                <div className="flex justify-end border-b border-border/60 px-3 py-1.5">
                    <Link href={gasHref} className="text-xs font-medium text-primary hover:underline">
                        Gas dashboard →
                    </Link>
                </div>
            ) : null}
            {alarms.length === 0 ? (
                <p className="p-4 text-center text-sm text-emerald-600 dark:text-emerald-400">No active sensor alarms.</p>
            ) : (
                <ul className="divide-y">
                    {alarms.map((alarm, i) => (
                        <li key={`${alarm.parameter}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                            <div className="min-w-0">
                                <p className="font-medium">{formatHumanLabel(alarm.parameter)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {alarm.value} / limit {alarm.threshold}
                                </p>
                            </div>
                            <IotHealthBadge status={alarm.severity} />
                        </li>
                    ))}
                </ul>
            )}
        </ConceptTableCard>
    );
}

export type GateFlowHourlyData = GateFlowData;

type GateFlowHourlyChartProps = {
    data: GateFlowHourlyData;
    title?: string;
};

export function GateFlowHourlyChart({
    data,
    title = 'Gate flow — hourly (24h)',
}: GateFlowHourlyChartProps) {
    const chartData = data.labels.map((label, i) => ({
        label,
        entries: data.entries[i],
        exits: data.exits[i],
    }));

    return (
        <IotChartCard title={title} description="Entry and exit events by hour">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={2} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={28} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="entries" name="Entries" fill="#14B8A6" radius={[2, 2, 0, 0]} maxBarSize={14} />
                    <Bar dataKey="exits" name="Exits" fill="#64748B" radius={[2, 2, 0, 0]} maxBarSize={14} />
                </BarChart>
            </ResponsiveContainer>
        </IotChartCard>
    );
}

export type EnvironmentalTrendData = {
    labels: string[];
    temp: (number | null)[];
    humidity: (number | null)[];
    wind: (number | null)[];
};

export function EnvironmentalTrendChart({ data }: { data: EnvironmentalTrendData }) {
    const chartData = data.labels.map((label, i) => ({
        label,
        temp: data.temp[i],
        humidity: data.humidity[i],
        wind: data.wind[i],
    }));

    return (
        <IotChartCard title="Environmental — 24h" description="Temperature, humidity, wind">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.45)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={3} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={32} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="temp" name="Temp °C" stroke="#22C55E" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="#3B82F6" dot={false} strokeWidth={1.5} connectNulls />
                    <Line type="monotone" dataKey="wind" name="Wind m/s" stroke="#8B5CF6" dot={false} strokeWidth={1.5} connectNulls />
                </LineChart>
            </ResponsiveContainer>
        </IotChartCard>
    );
}

export type ZoneMapPin = {
    id: number;
    name: string;
    code: string;
    zone_type: string;
    count: number;
    lat: number | null;
    lng: number | null;
};

const ZONE_TYPE_COLORS: Record<string, string> = {
    gate: 'bg-slate-600',
    general: 'bg-teal-600',
    restricted: 'bg-red-600',
    height_work: 'bg-amber-600',
    muster: 'bg-blue-600',
};

export function ZonePositionMap({ zones }: { zones: ZoneMapPin[] }) {
    const withCoords = zones.filter((z) => z.lat !== null && z.lng !== null);
    const maxCount = Math.max(...zones.map((z) => z.count), 1);

    return (
        <ConceptTableCard title="Zone map" description="Relative positions · bubble size = headcount">
            {withCoords.length > 0 ? (
                <div className="relative m-3 aspect-[2/1] min-h-[10rem] rounded-lg border bg-gradient-to-br from-muted/40 to-muted/10">
                    {withCoords.map((zone) => {
                        const latNorm = ((zone.lat ?? 0) % 1) * 100;
                        const lngNorm = ((zone.lng ?? 0) % 1) * 100;
                        const size = 24 + Math.round((zone.count / maxCount) * 20);
                        const color = ZONE_TYPE_COLORS[zone.zone_type] ?? 'bg-primary';

                        return (
                            <div
                                key={zone.id}
                                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                                style={{
                                    left: `${Math.min(92, Math.max(8, lngNorm))}%`,
                                    top: `${Math.min(88, Math.max(8, latNorm))}%`,
                                }}
                                title={`${zone.name}: ${zone.count} on site`}
                            >
                                <span
                                    className={cn(
                                        'flex items-center justify-center rounded-full font-bold text-white shadow-md ring-2 ring-background',
                                        color,
                                    )}
                                    style={{ width: size, height: size, fontSize: size < 30 ? 10 : 11 }}
                                >
                                    {zone.count}
                                </span>
                                <span className="mt-0.5 max-w-[5.5rem] truncate text-center text-[10px] font-medium leading-tight">
                                    {zone.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <IotEmptyState message="No map coordinates configured for zones" />
            )}
            <div className="grid gap-2 border-t p-3 sm:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone) => (
                    <div key={zone.id} className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-xs">
                        <div className="min-w-0">
                            <p className="truncate font-medium">{zone.name}</p>
                            <p className="text-muted-foreground">{formatHumanLabel(zone.zone_type)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-semibold tabular-nums">
                            {zone.count}
                        </span>
                    </div>
                ))}
            </div>
        </ConceptTableCard>
    );
}

type GasThresholdsProps = {
    thresholds: Record<string, Record<string, number>>;
};

export function GasThresholdsReference({ thresholds }: GasThresholdsProps) {
    const entries = Object.entries(thresholds);

    if (entries.length === 0) {
        return null;
    }

    return (
        <ConceptTableCard title="Alarm thresholds" description="Configured limits for gas & CO₂">
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {entries.map(([key, limits]) => (
                    <div key={key} className="rounded-md border bg-muted/20 px-2.5 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide">{formatHumanLabel(key)}</p>
                        <dl className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                            {Object.entries(limits).map(([bound, value]) => (
                                <div key={bound} className="flex justify-between gap-2">
                                    <dt>{formatHumanLabel(bound)}</dt>
                                    <dd className="font-medium text-foreground tabular-nums">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ))}
            </div>
        </ConceptTableCard>
    );
}

type VehicleGasPanelProps = {
    gateways: {
        gateway: string;
        vehicle_label?: string | null;
        lel_pct: number | string | null;
        o2_pct?: number | string | null;
        h2s_ppm?: number | string | null;
        co_ppm?: number | string | null;
        alarm_state?: string | null;
    }[];
    thresholds?: { low?: number; high?: number };
};

export function VehicleGasPanels({ gateways, thresholds }: VehicleGasPanelProps) {
    if (gateways.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {gateways.map((g) => {
                const lel = g.lel_pct !== null ? Number(g.lel_pct) : null;
                const alarmActive = g.alarm_state && g.alarm_state !== 'normal';

                return (
                    <Card
                        key={g.gateway}
                        className={cn(
                            'border-border/80 shadow-sm transition-colors',
                            alarmActive && 'border-destructive/40 bg-destructive/5',
                        )}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {g.vehicle_label ?? g.gateway}
                                </p>
                                {g.alarm_state ? <IotHealthBadge status={g.alarm_state} /> : null}
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-xs">
                                {[
                                    { label: 'LEL', value: lel !== null ? `${lel}%` : '—', highlight: lel !== null },
                                    { label: 'O₂', value: g.o2_pct !== null ? `${g.o2_pct}%` : '—' },
                                    { label: 'H₂S', value: g.h2s_ppm !== null ? `${g.h2s_ppm}` : '—' },
                                    { label: 'CO', value: g.co_ppm !== null ? `${g.co_ppm}` : '—' },
                                ].map((metric) => (
                                    <div
                                        key={metric.label}
                                        className={cn(
                                            'rounded-md bg-muted/40 px-1 py-1.5',
                                            metric.highlight &&
                                                lel !== null &&
                                                `ring-1 ring-inset ring-[${lelSeverityColor(lel, thresholds)}]`,
                                        )}
                                        style={
                                            metric.highlight && lel !== null
                                                ? { boxShadow: `inset 0 0 0 1px ${lelSeverityColor(lel, thresholds)}` }
                                                : undefined
                                        }
                                    >
                                        <p className="text-[10px] text-muted-foreground">{metric.label}</p>
                                        <p className="font-semibold tabular-nums">{metric.value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

type UdpmSectionSummary = {
    key: string;
    title: string;
    status: string;
    metrics: { label: string; value: string | number }[];
    href?: string;
};

export function UdpmSectionCards({ sections }: { sections: UdpmSectionSummary[] }) {
    return (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => {
                const inner = (
                    <>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">
                                §{section.key} {section.title}
                            </p>
                            <ConceptStatusBadge tone={section.status.includes('manual') ? 'warning' : 'success'}>
                                {section.status.replace(/_/g, ' ')}
                            </ConceptStatusBadge>
                        </div>
                        <dl className="mt-2 space-y-1 text-xs">
                            {section.metrics.map((m) => (
                                <div key={m.label} className="flex justify-between gap-2">
                                    <dt className="text-muted-foreground">{m.label}</dt>
                                    <dd className="font-medium tabular-nums">{m.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </>
                );

                if (section.href) {
                    return (
                        <Link
                            key={section.key}
                            href={section.href}
                            className="group block rounded-xl border border-border/80 bg-card shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/30"
                        >
                            <div className="p-3">{inner}</div>
                        </Link>
                    );
                }

                return (
                    <Card key={section.key} className="border-border/80 shadow-sm">
                        <CardContent className="p-3">{inner}</CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

export function CompactReadingsTable({
    title,
    description,
    columns,
    rows,
}: {
    title: string;
    description?: string;
    columns: string[];
    rows: ReactNode[][];
}) {
    return (
        <ConceptTableCard title={title} description={description}>
            {rows.length === 0 ? (
                <IotEmptyState message="No readings available" />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                {columns.map((col) => (
                                    <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {rows.map((cells, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-muted/20">
                                    {cells.map((cell, cellIndex) => (
                                        <td key={cellIndex} className="px-3 py-2 align-middle">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ConceptTableCard>
    );
}
