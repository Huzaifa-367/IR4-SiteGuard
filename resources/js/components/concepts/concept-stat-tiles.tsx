import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ConceptStatTile = {
    label: string;
    value: string | number;
    hint?: string;
};

type ConceptStatTilesProps = {
    stats: ConceptStatTile[];
    className?: string;
};

/**
 * Top-of-page metric strip similar to Ecme concept list headers.
 */
export function ConceptStatTiles({ stats, className }: ConceptStatTilesProps) {
    return (
        <div
            className={cn(
                'grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
                className,
            )}
        >
            {stats.map((stat) => (
                <Card
                    key={stat.label}
                    className="border-border/80 shadow-none"
                >
                    <CardContent className="p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {stat.label}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
                            {stat.value}
                        </p>
                        {stat.hint !== undefined && stat.hint !== '' && (
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stat.hint}
                            </p>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
