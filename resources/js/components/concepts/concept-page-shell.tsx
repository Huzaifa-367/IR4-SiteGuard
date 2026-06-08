import { cn } from '@/lib/utils';

type ConceptPageShellProps = {
    children: React.ReactNode;
    className?: string;
};

/**
 * Ecme-style main content width: generous max width, consistent horizontal
 * padding, vertical rhythm between stacked sections.
 */
export function ConceptPageShell({
    children,
    className,
}: ConceptPageShellProps) {
    return (
        <div
            className={cn(
                'mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8',
                className,
            )}
        >
            {children}
        </div>
    );
}
