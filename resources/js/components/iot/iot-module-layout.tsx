import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { DashboardSection } from '@/components/dashboard/dashboard-section';
import { IotEmptyState } from '@/components/iot/iot-ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function IotModuleSection({
    title,
    description,
    action,
    children,
    className,
    accent = 'iot',
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    accent?: 'default' | 'iot' | 'danger' | 'amber';
}) {
    return (
        <DashboardSection
            title={title}
            description={description}
            action={action}
            className={className}
            accent={accent}
        >
            {children}
        </DashboardSection>
    );
}

export function IotDetailStat({
    label,
    value,
    sub,
    className,
}: {
    label: string;
    value: ReactNode;
    sub?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('rounded-lg border border-border/80 bg-gradient-to-br from-card to-muted/20 px-3 py-2.5', className)}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <div className="mt-0.5 text-sm font-semibold leading-tight">{value}</div>
            {sub ? <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div> : null}
        </div>
    );
}

export function IotDetailStatGrid({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-4', className)}>
            {children}
        </div>
    );
}

export function IotLinkedResource({
    label,
    href,
    hint,
}: {
    label: string;
    href: string;
    hint?: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
        >
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="truncate text-sm font-medium text-primary group-hover:underline">{hint ?? 'Open'}</p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
    );
}

export function IotViewLink({ href, label = 'View' }: { href: string; label?: string }) {
    return (
        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
            <Link href={href}>
                {label}
                <ArrowRight className="ml-1 size-3" />
            </Link>
        </Button>
    );
}

export function IotRecordsEmpty({ message, action }: { message: string; action?: ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 px-4 py-10">
            <IotEmptyState message={message} />
            {action}
        </div>
    );
}
