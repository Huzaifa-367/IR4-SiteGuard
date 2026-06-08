import { cn } from '@/lib/utils';

/**
 * Tonal status pill mirroring Ecme list/details — soft background + matching
 * foreground colour. Map status strings to one of the 7 semantic tones.
 */
export type StatusTone =
    | 'neutral'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'progress'
    | 'muted';

const toneClass: Record<StatusTone, string> = {
    neutral:
        'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/20',
    info: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
    success:
        'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
    warning:
        'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
    danger:
        'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
    progress:
        'bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/30',
    muted: 'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
};

type ConceptStatusBadgeProps = {
    tone?: StatusTone;
    children: React.ReactNode;
    className?: string;
};

export function ConceptStatusBadge({
    tone = 'neutral',
    children,
    className,
}: ConceptStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                toneClass[tone],
                className,
            )}
        >
            <span
                aria-hidden
                className={cn(
                    'size-1.5 rounded-full',
                    tone === 'success' && 'bg-emerald-500',
                    tone === 'warning' && 'bg-amber-500',
                    tone === 'danger' && 'bg-rose-500',
                    tone === 'info' && 'bg-sky-500',
                    tone === 'progress' && 'bg-indigo-500',
                    tone === 'neutral' && 'bg-slate-400',
                    tone === 'muted' && 'bg-muted-foreground/60',
                )}
            />
            {children}
        </span>
    );
}

/**
 * Maps every WMS lifecycle status string used in the app to a tone — kept
 * in one place so list, edit, and details pages render consistently.
 */
export function toneForStatus(status: string): StatusTone {
    switch (status) {
        case 'draft':
            return 'neutral';
        case 'submitted':
        case 'pending':
        case 'pending_estimation':
        case 'pending_director':
        case 'pending_budget':
        case 'pending_procurement':
        case 'pending_review':
        case 'vendor_pending':
            return 'info';
        case 'approved':
        case 'vendor_accepted':
        case 'received':
        case 'fully_shipped':
        case 'issued':
        case 'completed':
        case 'posted':
            return 'success';
        case 'partially_shipped':
        case 'partially_received':
        case 'partially_issued':
        case 'partially_qc_completed':
        case 'partially_actioned':
        case 'in_progress':
        case 'in_transit':
            return 'progress';
        case 'on_hold':
        case 'pending_action':
            return 'warning';
        case 'rejected':
        case 'cancelled':
        case 'vendor_rejected':
        case 'expired':
        case 'void':
            return 'danger';
        case 'closed':
            return 'muted';
        default:
            return 'neutral';
    }
}
