import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { index as alertsIndex } from '@/routes/alerts';
import { index as investigationsIndex } from '@/routes/investigations';
import { overview as hseIncidentsOverview } from '@/routes/iot/hse-incidents';
import { overview as lsrOverview } from '@/routes/iot/lsr';
import { index as reportsIndex } from '@/routes/reports';

export type OperationsPulseItem = {
    key: string;
    label: string;
    value: number | string;
    hint: string;
};

const PULSE_ROUTES: Record<string, () => string> = {
    open_alerts: alertsIndex,
    investigations: investigationsIndex,
    hse_pending: hseIncidentsOverview,
    lsr_open: lsrOverview,
    reports: reportsIndex,
};

const PULSE_ACCENT: Record<string, string> = {
    open_alerts: 'border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-card hover:border-orange-500/50',
    investigations: 'border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-card hover:border-violet-500/50',
    hse_pending: 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-card hover:border-red-500/50',
    lsr_open: 'border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-card hover:border-amber-500/50',
    reports: 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-card hover:border-blue-500/50',
};

type DashboardOperationsPulseProps = {
    items: OperationsPulseItem[];
};

export function DashboardOperationsPulse({ items }: DashboardOperationsPulseProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => {
                const href = PULSE_ROUTES[item.key]?.();
                const accent = PULSE_ACCENT[item.key] ?? 'border-border/80 bg-card hover:border-primary/40';

                const inner = (
                    <>
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                {item.label}
                            </p>
                            {href ? (
                                <ArrowRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            ) : null}
                        </div>
                        <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{item.value}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{item.hint}</p>
                    </>
                );

                if (href) {
                    return (
                        <Link
                            key={item.key}
                            href={href}
                            className={cn(
                                'group rounded-lg border p-3 shadow-sm transition-colors',
                                accent,
                            )}
                        >
                            {inner}
                        </Link>
                    );
                }

                return (
                    <div key={item.key} className={cn('rounded-lg border p-3 shadow-sm', accent)}>
                        {inner}
                    </div>
                );
            })}
        </div>
    );
}
