import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AiInlineMarkdownProps = {
    text: string;
    className?: string;
    linkClassName?: string;
};

export default function AiInlineMarkdown({
    text,
    className,
    linkClassName,
}: AiInlineMarkdownProps): ReactNode[] {
    const nodes: ReactNode[] = [];
    const pattern =
        /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|!\[[^\]]*\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        const token = match[0];

        if (token.startsWith('**') && token.endsWith('**')) {
            nodes.push(
                <strong key={key++} className="font-semibold">
                    {token.slice(2, -2)}
                </strong>,
            );
        } else if (token.startsWith('`') && token.endsWith('`')) {
            nodes.push(
                <code
                    key={key++}
                    className="rounded bg-muted/80 px-1 py-0.5 font-mono text-[0.85em] ring-1 ring-border/50"
                >
                    {token.slice(1, -1)}
                </code>,
            );
        } else if (token.startsWith('*') && token.endsWith('*') && ! token.startsWith('**')) {
            nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
        } else if (token.startsWith('![')) {
            const imageMatch = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            if (imageMatch) {
                nodes.push(
                    <img
                        key={key++}
                        src={imageMatch[2]}
                        alt={imageMatch[1]}
                        className="my-1 inline-block max-h-8 max-w-full rounded object-contain"
                    />,
                );
            }
        } else if (token.startsWith('[')) {
            const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                const href = linkMatch[2];
                const isExternal = /^https?:\/\//i.test(href);
                nodes.push(
                    <a
                        key={key++}
                        href={href}
                        className={cn(
                            'font-medium text-primary underline underline-offset-2 hover:text-primary/80',
                            linkClassName,
                        )}
                        {...(isExternal
                            ? { target: '_blank', rel: 'noreferrer noopener' }
                            : {})}
                    >
                        {linkMatch[1]}
                    </a>,
                );
            }
        }

        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        nodes.push(<span key={key++} className={className}>{text.slice(lastIndex)}</span>);
    }

    return nodes.length > 0 ? nodes : [text];
}
