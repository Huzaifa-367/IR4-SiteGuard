import { Bot, User } from 'lucide-react';
import AiMarkdownContent from '@/components/ai/ai-markdown-content';
import AiMessageEnrichmentPanel from '@/components/ai/ai-message-enrichment';
import type { AiMessageEnrichment } from '@/lib/ai-markdown-types';
import { cn } from '@/lib/utils';

type AiChatMessageProps = AiMessageEnrichment & {
    role: string;
    content: string;
    isStreaming?: boolean;
};

export default function AiChatMessage({
    role,
    content,
    isStreaming = false,
    chart_spec,
    proposed_actions,
    citations,
}: AiChatMessageProps) {
    const isUser = role === 'user';

    return (
        <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
            <div
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full ring-1',
                    isUser
                        ? 'bg-primary text-primary-foreground ring-primary/20'
                        : 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300',
                )}
            >
                {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div
                className={cn(
                    'min-w-0 max-w-[min(100%,42rem)] rounded-2xl px-4 py-3 shadow-sm ring-1',
                    isUser
                        ? 'bg-primary text-primary-foreground ring-primary/20'
                        : 'bg-card text-card-foreground ring-border/60',
                )}
            >
                <p
                    className={cn(
                        'mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide',
                        isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                >
                    {isUser ? 'You' : 'Safety assistant'}
                </p>
                {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                ) : (
                    <>
                        <AiMarkdownContent content={content} isStreaming={isStreaming} />
                        {! isStreaming ? (
                            <AiMessageEnrichmentPanel
                                chart_spec={chart_spec}
                                proposed_actions={proposed_actions}
                                citations={citations}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
