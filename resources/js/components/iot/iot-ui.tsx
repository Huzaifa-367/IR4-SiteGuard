import type { ReactNode } from 'react';
import { ConceptStatusBadge } from '@/components/concepts/concept-status-badge';
import { cn } from '@/lib/utils';
import {
    formatCompactTime,
    formatHumanLabel,
    healthTone,
    type HealthTone,
    utilizationTone,
} from '@/lib/iot-format';

export function IotHealthBadge({
    status,
    className,
}: {
    status: string | null | undefined;
    className?: string;
}) {
    const tone = healthTone(status);

    return (
        <ConceptStatusBadge tone={tone} className={className}>
            {status ? formatHumanLabel(status) : '—'}
        </ConceptStatusBadge>
    );
}

export function IotUtilizationBar({
    value,
    max,
    utilization,
    className,
}: {
    value: number;
    max: number | null;
    utilization?: number | null;
    className?: string;
}) {
    const pct = utilization ?? (max && max > 0 ? Math.min(100, (value / max) * 100) : null);
    const tone = utilizationTone(pct);
    const width = pct !== null ? `${Math.min(100, pct)}%` : '0%';

    const barColor: Record<HealthTone, string> = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-destructive',
        muted: 'bg-muted-foreground/40',
    };

    return (
        <div className={cn('space-y-1', className)}>
            <div className="flex items-center justify-between gap-2 text-xs">
                <span className="tabular-nums font-medium">
                    {value}
                    {max !== null ? ` / ${max}` : ''}
                </span>
                {pct !== null ? (
                    <span className="text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                ) : null}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn('h-full rounded-full transition-all', barColor[tone])}
                    style={{ width }}
                />
            </div>
        </div>
    );
}

export function IotInventoryGauge({
    label,
    actual,
    expected,
    hint,
}: {
    label: string;
    actual: number;
    expected: number | null;
    hint?: string;
}) {
    const pct =
        expected !== null && expected > 0
            ? Math.min(100, Math.round((actual / expected) * 100))
            : null;
    const complete = expected !== null && actual >= expected;

    return (
        <div className="rounded-lg border border-border/70 bg-card/50 p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {expected !== null ? (
                    <ConceptStatusBadge tone={complete ? 'success' : 'warning'}>
                        {actual}/{expected}
                    </ConceptStatusBadge>
                ) : (
                    <span className="text-sm font-semibold tabular-nums">{actual}</span>
                )}
            </div>
            {pct !== null ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn(
                            'h-full rounded-full',
                            complete ? 'bg-emerald-500' : 'bg-primary/70',
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            ) : null}
            {hint ? <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
    );
}

export function IotMiniStat({
    label,
    value,
    sub,
    tone,
}: {
    label: string;
    value: ReactNode;
    sub?: string;
    tone?: HealthTone;
}) {
    return (
        <div className="rounded-lg border border-border/70 bg-gradient-to-br from-card to-muted/20 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <p
                className={cn(
                    'mt-0.5 text-lg font-semibold tabular-nums leading-tight',
                    tone === 'danger' && 'text-destructive',
                    tone === 'warning' && 'text-amber-600 dark:text-amber-400',
                    tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
                )}
            >
                {value}
            </p>
            {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
        </div>
    );
}

export function IotEmptyState({ message }: { message: string }) {
    return (
        <p className="flex min-h-[8rem] items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {message}
        </p>
    );
}

export function IotRelativeTime({ iso }: { iso: string | null | undefined }) {
    return (
        <span className="text-muted-foreground" title={iso ?? undefined}>
            {formatCompactTime(iso)}
        </span>
    );
}

export function IotSectionTabs({
    items,
    active,
    onChange,
    className,
}: {
    items: { key: string; label: string; count?: number }[];
    active: string;
    onChange: (key: string) => void;
    className?: string;
}) {
    return (
        <div className={cn('flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1', className)}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={() => onChange(item.key)}
                    className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                        active === item.key
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {item.label}
                    {item.count !== undefined ? (
                        <span className="ml-1 tabular-nums text-muted-foreground">({item.count})</span>
                    ) : null}
                </button>
            ))}
        </div>
    );
}
