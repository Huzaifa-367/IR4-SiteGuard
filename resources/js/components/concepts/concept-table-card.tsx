import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type ConceptTableCardProps = {
    title?: string;
    description?: string;
    /** When false, renders a flat bordered panel (Ecme “table only” look). */
    withCardChrome?: boolean;
    children: React.ReactNode;
    className?: string;
};

/**
 * Wraps dense data tables in a card shell with optional title — used on
 * product list, order list, and detail line grids.
 */
export function ConceptTableCard({
    title,
    description,
    withCardChrome = true,
    children,
    className,
}: ConceptTableCardProps) {
    if (!withCardChrome) {
        return (
            <div
                className={cn(
                    'overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm',
                    className,
                )}
            >
                {children}
            </div>
        );
    }

    return (
        <Card
            className={cn(
                'overflow-hidden border-border/80 shadow-sm',
                className,
            )}
        >
            {(title !== undefined || description !== undefined) && (
                <CardHeader className="border-b border-border/60 bg-muted/30 py-4">
                    {title !== undefined && (
                        <CardTitle className="text-base font-semibold">
                            {title}
                        </CardTitle>
                    )}
                    {description !== undefined && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </CardHeader>
            )}
            <CardContent className="p-0">{children}</CardContent>
        </Card>
    );
}
