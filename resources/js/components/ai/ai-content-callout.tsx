import { AlertTriangle, Info, Lightbulb, ShieldAlert } from 'lucide-react';
import AiInlineMarkdown from '@/components/ai/ai-inline-markdown';
import type { CalloutVariant } from '@/lib/ai-markdown-types';
import { cn } from '@/lib/utils';

type AiContentCalloutProps = {
    variant: CalloutVariant;
    lines: string[];
};

const variantStyles: Record<
    CalloutVariant,
    { container: string; icon: typeof Info; label: string }
> = {
    default: {
        container: 'border-border/70 bg-muted/30',
        icon: Info,
        label: 'Note',
    },
    note: {
        container: 'border-sky-500/30 bg-sky-500/10',
        icon: Info,
        label: 'Note',
    },
    tip: {
        container: 'border-emerald-500/30 bg-emerald-500/10',
        icon: Lightbulb,
        label: 'Tip',
    },
    warning: {
        container: 'border-amber-500/40 bg-amber-500/10',
        icon: AlertTriangle,
        label: 'Warning',
    },
    important: {
        container: 'border-violet-500/30 bg-violet-500/10',
        icon: ShieldAlert,
        label: 'Important',
    },
};

export default function AiContentCallout({ variant, lines }: AiContentCalloutProps) {
    const style = variantStyles[variant];
    const Icon = style.icon;

    return (
        <section
            className={cn(
                'my-3 rounded-lg border px-4 py-3',
                style.container,
            )}
        >
            <header className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="size-3.5 shrink-0" aria-hidden />
                {style.label}
            </header>
            <div className="space-y-1 text-sm leading-relaxed">
                {lines.map((line, index) => (
                    <p key={index}>
                        <AiInlineMarkdown text={line} />
                    </p>
                ))}
            </div>
        </section>
    );
}
