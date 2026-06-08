import { cn } from '@/lib/utils';

type ConceptPageHeaderProps = {
    title: string;
    description?: string;
    children?: React.ReactNode;
    className?: string;
};

export function ConceptPageHeader({
    title,
    description,
    children,
    className,
}: ConceptPageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
                className,
            )}
        >
            <div className="min-w-0 space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                {description !== undefined && description !== '' && (
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            {children !== undefined && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {children}
                </div>
            )}
        </div>
    );
}
