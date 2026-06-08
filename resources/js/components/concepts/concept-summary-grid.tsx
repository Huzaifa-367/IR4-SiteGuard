import { cn } from '@/lib/utils';

export type ConceptSummaryItem = {
    label: string;
    value: React.ReactNode;
};

type ConceptSummaryGridProps = {
    items: ConceptSummaryItem[];
    columns?: 1 | 2 | 3;
    className?: string;
};

/**
 * Read-only key/value grid for order/product detail pages (Ecme details tab).
 */
export function ConceptSummaryGrid({
    items,
    columns = 2,
    className,
}: ConceptSummaryGridProps) {
    const grid =
        columns === 3
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : columns === 1
              ? 'grid-cols-1'
              : 'sm:grid-cols-2';

    return (
        <dl
            className={cn(
                'grid gap-x-8 gap-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-sm',
                grid,
                className,
            )}
        >
            {items.map((row) => (
                <div key={row.label} className="space-y-1">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {row.label}
                    </dt>
                    <dd className="text-sm font-medium text-foreground">
                        {row.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
