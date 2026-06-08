import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type DashboardKpi = {
    key: string;
    label: string;
    value: string | number;
    hint: string;
    delta: number | null;
    deltaLabel: string | null;
    sparkline: number[];
};

type DashboardKpiStripProps = {
    kpis: DashboardKpi[];
};

const KPI_ACCENT: Record<string, { stroke: string; fill: string; ring: string }> = {
    open_alerts: {
        stroke: '#F97316',
        fill: 'rgba(249, 115, 22, 0.2)',
        ring: 'ring-orange-500/20',
    },
    critical_open: {
        stroke: '#EF4444',
        fill: 'rgba(239, 68, 68, 0.2)',
        ring: 'ring-red-500/20',
    },
    cameras_online: {
        stroke: '#10B981',
        fill: 'rgba(16, 185, 129, 0.2)',
        ring: 'ring-emerald-500/20',
    },
    avg_ack: {
        stroke: '#8B5CF6',
        fill: 'rgba(139, 92, 246, 0.2)',
        ring: 'ring-violet-500/20',
    },
    fp_rate: {
        stroke: '#64748B',
        fill: 'rgba(100, 116, 139, 0.2)',
        ring: 'ring-slate-500/20',
    },
    events_24h: {
        stroke: '#3B82F6',
        fill: 'rgba(59, 130, 246, 0.2)',
        ring: 'ring-blue-500/20',
    },
};

const DEFAULT_ACCENT = {
    stroke: 'hsl(var(--primary))',
    fill: 'hsl(var(--primary) / 0.15)',
    ring: 'ring-primary/20',
};

function Sparkline({
    data,
    accent,
    kpiKey,
}: {
    data: number[];
    accent: typeof DEFAULT_ACCENT;
    kpiKey: string;
}) {
    if (data.length === 0) {
        return <div className="h-14 rounded-md bg-muted/40" />;
    }

    const chartData = data.map((value, index) => ({ index, value }));

    return (
        <div className="h-14 w-full rounded-md bg-muted/20 px-1 pt-1">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${kpiKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accent.fill} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={accent.fill} stopOpacity={0.05} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={accent.stroke}
                        fill={`url(#spark-${kpiKey})`}
                        strokeWidth={2}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export function DashboardKpiStrip({ kpis }: DashboardKpiStripProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {kpis.map((kpi) => {
                const accent = KPI_ACCENT[kpi.key] ?? DEFAULT_ACCENT;

                return (
                    <Card
                        key={kpi.key}
                        className={cn(
                            'overflow-hidden border-border/80 shadow-sm ring-1',
                            accent.ring,
                        )}
                    >
                        <CardContent className="space-y-3 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {kpi.label}
                            </p>
                            <div className="flex items-baseline justify-between gap-2">
                                <p
                                    className="text-3xl font-semibold tabular-nums tracking-tight"
                                    style={{ color: accent.stroke }}
                                >
                                    {kpi.value}
                                </p>
                                {kpi.delta !== null && kpi.delta !== 0 ? (
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
                                            kpi.delta > 0
                                                ? 'bg-destructive/15 text-destructive'
                                                : 'bg-emerald-500/15 text-emerald-600',
                                        )}
                                    >
                                        {kpi.delta > 0 ? '▲' : '▼'}
                                        {Math.abs(kpi.delta)}
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {kpi.hint}
                                {kpi.deltaLabel ? ` · ${kpi.deltaLabel}` : ''}
                            </p>
                            <Sparkline data={kpi.sparkline} accent={accent} kpiKey={kpi.key} />
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
