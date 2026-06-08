import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

export type ConceptPaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type ConceptPaginationProps = {
    links: ConceptPaginationLink[];
    className?: string;
};

/**
 * Laravel paginator `links` rendered as Ecme-style pill controls.
 */
export function ConceptPagination({ links, className }: ConceptPaginationProps) {
    const visible = links.filter((l) => l.url !== null || l.label === '…');

    if (visible.length <= 1) {
        return null;
    }

    return (
        <nav
            className={cn(
                'flex flex-wrap items-center justify-end gap-1 pt-4',
                className,
            )}
            aria-label="Pagination"
        >
            {links.map((link, i) => {
                const key = `${link.label}-${i}`;
                const isNav = link.label.includes('Previous') || link.label.includes('Next');

                if (link.url === null) {
                    return (
                        <span
                            key={key}
                            className={cn(
                                'inline-flex min-w-9 items-center justify-center rounded-md border border-transparent px-2 py-1.5 text-sm text-muted-foreground',
                                link.active &&
                                    'border-primary/30 bg-primary/10 font-medium text-primary',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={key}
                        href={link.url}
                        preserveScroll
                        preserveState
                        className={cn(
                            'inline-flex min-w-9 items-center justify-center rounded-md border px-2 py-1.5 text-sm transition-colors',
                            link.active
                                ? 'border-primary/40 bg-primary text-primary-foreground shadow-sm'
                                : 'border-border/80 bg-background text-foreground hover:bg-muted/80',
                            isNav && 'px-3',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </nav>
    );
}
