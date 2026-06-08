import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ConceptToolbarProps = {
    searchPlaceholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    children?: React.ReactNode;
    className?: string;
};

/**
 * Toolbar row under the page header: search + filter controls + trailing slot
 * (e.g. column picker, export) — mirrors Ecme product/order list chrome.
 */
export function ConceptToolbar({
    searchPlaceholder = 'Search…',
    searchValue,
    onSearchChange,
    children,
    className,
}: ConceptToolbarProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4',
                className,
            )}
        >
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="h-10 pl-9"
                    autoComplete="off"
                />
            </div>
            {children !== undefined && (
                <div className="flex flex-wrap items-center gap-2">{children}</div>
            )}
        </div>
    );
}
