import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type { ChartSpec } from '@/lib/ai-markdown-types';

const CHART_COLORS = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
];

type AiContentChartProps = {
    spec: ChartSpec;
};

export default function AiContentChart({ spec }: AiContentChartProps) {
    const labels = spec.labels ?? [];
    const values = spec.values ?? [];
    const chartType = spec.type ?? 'bar';

    if (labels.length === 0 || values.length === 0) {
        return null;
    }

    const data = labels.map((label, index) => ({
        label,
        value: values[index] ?? 0,
    }));

    return (
        <section className="my-3 rounded-lg border border-border/70 bg-muted/20 p-3">
            {spec.title ? (
                <h4 className="mb-2 text-sm font-semibold text-foreground">{spec.title}</h4>
            ) : null}
            <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="var(--chart-1)"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                            />
                        </LineChart>
                    ) : chartType === 'pie' ? (
                        <PieChart>
                            <Tooltip />
                            <Legend />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                outerRadius="70%"
                                label={false}
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={index}
                                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    ) : (
                        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </section>
    );
}
