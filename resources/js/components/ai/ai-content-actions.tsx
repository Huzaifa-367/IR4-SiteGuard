import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProposedAction } from '@/lib/ai-markdown-types';
import { normalizeProposedActions } from '@/lib/normalize-ai-enrichment';

type AiContentActionsProps = {
    actions: ProposedAction[] | unknown;
};

function formatActionType(type: string | undefined): string {
    const value = typeof type === 'string' && type !== '' ? type : 'action';

    return value.replace(/_/g, ' ');
}

export default function AiContentActions({ actions }: AiContentActionsProps) {
    const items = normalizeProposedActions(actions);

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="mt-3 border-t border-border/60 pt-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="size-3.5" aria-hidden />
                Suggested actions
            </h4>
            <ul className="space-y-2">
                {items.map((action, index) => (
                    <li
                        key={`${action.type}-${index}`}
                        className="flex flex-col gap-2 rounded-lg border border-border/70 bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                                {action.title ?? formatActionType(action.type)}
                            </p>
                            <p className="text-xs capitalize text-muted-foreground">
                                {formatActionType(action.type)}
                            </p>
                        </div>
                        <Button type="button" size="sm" variant="outline" disabled className="shrink-0">
                            Review (soon)
                        </Button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
