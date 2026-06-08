import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardSectionProps = {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    accent?: 'default' | 'iot' | 'danger' | 'amber';
};

const ACCENT_BAR: Record<NonNullable<DashboardSectionProps['accent']>, string> = {
    default: 'from-primary/80 to-primary/20',
    iot: 'from-cyan-500/80 to-cyan-500/20',
    danger: 'from-destructive/80 to-destructive/20',
    amber: 'from-amber-500/80 to-amber-500/20',
};

export function DashboardSection({
    title,
    description,
    action,
    children,
    className,
    accent = 'default',
}: DashboardSectionProps) {
    return (
        <section className={cn('space-y-3', className)}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div
                        className={cn(
                            'mt-0.5 h-8 w-1 shrink-0 rounded-full bg-gradient-to-b',
                            ACCENT_BAR[accent],
                        )}
                    />
                    <div className="min-w-0">
                        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
                        {description ? (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        ) : null}
                    </div>
                </div>
                {action ? <div className="shrink-0">{action}</div> : null}
            </div>
            {children}
        </section>
    );
}
