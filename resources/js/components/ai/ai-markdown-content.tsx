import { Check } from 'lucide-react';
import { type ReactNode, useMemo } from 'react';
import AiContentCallout from '@/components/ai/ai-content-callout';
import AiContentCodeBlock from '@/components/ai/ai-content-code-block';
import AiContentImage from '@/components/ai/ai-content-image';
import AiContentTable from '@/components/ai/ai-content-table';
import AiInlineMarkdown from '@/components/ai/ai-inline-markdown';
import type { MarkdownBlock } from '@/lib/ai-markdown-types';
import { parseAiMarkdown } from '@/lib/parse-ai-markdown';
import { cn } from '@/lib/utils';

type AiMarkdownContentProps = {
    content: string;
    isStreaming?: boolean;
    className?: string;
};

function renderBlock(block: MarkdownBlock, key: number): ReactNode {
    switch (block.type) {
        case 'heading': {
            const headingClass =
                block.level === 1
                    ? 'mt-4 mb-2 text-base font-semibold tracking-tight'
                    : block.level === 2
                      ? 'mt-3 mb-2 text-sm font-semibold'
                      : block.level === 3
                        ? 'mt-2 mb-1.5 text-sm font-medium'
                        : 'mt-2 mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground';
            const level = Math.min(block.level, 6);

            if (level === 1) {
                return (
                    <h1 key={key} className={headingClass}>
                        <AiInlineMarkdown text={block.text} />
                    </h1>
                );
            }

            if (level === 2) {
                return (
                    <h2 key={key} className={headingClass}>
                        <AiInlineMarkdown text={block.text} />
                    </h2>
                );
            }

            if (level === 3) {
                return (
                    <h3 key={key} className={headingClass}>
                        <AiInlineMarkdown text={block.text} />
                    </h3>
                );
            }

            if (level === 4) {
                return (
                    <h4 key={key} className={headingClass}>
                        <AiInlineMarkdown text={block.text} />
                    </h4>
                );
            }

            if (level === 5) {
                return (
                    <h5 key={key} className={headingClass}>
                        <AiInlineMarkdown text={block.text} />
                    </h5>
                );
            }

            return (
                <h6 key={key} className={headingClass}>
                    <AiInlineMarkdown text={block.text} />
                </h6>
            );
        }
        case 'paragraph':
            return (
                <p key={key} className="leading-relaxed">
                    <AiInlineMarkdown text={block.text} />
                </p>
            );
        case 'list': {
            const ListTag = block.ordered ? 'ol' : 'ul';
            const hasTasks = block.items.some((item) => item.checked !== undefined);

            return (
                <ListTag
                    key={key}
                    className={cn(
                        'my-2 space-y-1.5',
                        block.ordered ? 'list-decimal pl-5' : hasTasks ? 'list-none pl-0' : 'list-disc pl-5',
                    )}
                >
                    {block.items.map((item, index) => (
                        <li
                            key={index}
                            className={cn(
                                'leading-relaxed',
                                hasTasks && 'flex items-start gap-2',
                            )}
                        >
                            {item.checked !== undefined ? (
                                <span
                                    className={cn(
                                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                                        item.checked
                                            ? 'border-emerald-600 bg-emerald-600 text-white'
                                            : 'border-border bg-background',
                                    )}
                                    aria-hidden
                                >
                                    {item.checked ? <Check className="size-2.5" /> : null}
                                </span>
                            ) : null}
                            <span className={cn(item.checked ? 'text-muted-foreground line-through' : undefined)}>
                                <AiInlineMarkdown text={item.text} />
                            </span>
                        </li>
                    ))}
                </ListTag>
            );
        }
        case 'code':
            return <AiContentCodeBlock key={key} language={block.language} code={block.code} />;
        case 'table':
            return <AiContentTable key={key} headers={block.headers} rows={block.rows} />;
        case 'blockquote':
            return (
                <AiContentCallout key={key} variant={block.variant} lines={block.lines} />
            );
        case 'hr':
            return <hr key={key} className="my-4 border-border/70" />;
        case 'image':
            return <AiContentImage key={key} alt={block.alt} src={block.src} />;
        default:
            return null;
    }
}

export default function AiMarkdownContent({
    content,
    isStreaming = false,
    className,
}: AiMarkdownContentProps) {
    const blocks = useMemo(() => parseAiMarkdown(content), [content]);

    if (content === '' && isStreaming) {
        return (
            <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
                <span className="flex gap-1">
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                </span>
                <span className="text-xs">Thinking…</span>
            </div>
        );
    }

    return (
        <div className={cn('space-y-1 text-sm text-foreground/95', className)}>
            {blocks.map((block, index) => renderBlock(block, index))}
            {isStreaming && content !== '' ? (
                <span
                    className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-primary"
                    aria-hidden
                />
            ) : null}
        </div>
    );
}
