import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConceptPageActionsProps = {
    backHref: string;
    backLabel?: string;
    children?: React.ReactNode;
    className?: string;
};

/**
 * Secondary row: back link + optional action cluster (Ecme edit header).
 */
export function ConceptPageActions({
    backHref,
    backLabel = 'Back to list',
    children,
    className,
}: ConceptPageActionsProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-3',
                className,
            )}
        >
            <Button variant="ghost" size="sm" className="-ml-2 gap-1 px-2" asChild>
                <Link href={backHref}>
                    <ArrowLeft className="size-4" />
                    {backLabel}
                </Link>
            </Button>
            {children !== undefined && (
                <div className="flex flex-wrap items-center gap-2">{children}</div>
            )}
        </div>
    );
}
