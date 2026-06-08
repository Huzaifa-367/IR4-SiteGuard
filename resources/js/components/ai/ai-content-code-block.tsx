import { cn } from '@/lib/utils';

type AiContentCodeBlockProps = {
    language: string;
    code: string;
};

export default function AiContentCodeBlock({ language, code }: AiContentCodeBlockProps) {
    return (
        <div className="my-3 overflow-hidden rounded-lg border border-border/70 bg-muted/40">
            {language ? (
                <div className="border-b border-border/60 bg-muted/60 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                    {language}
                </div>
            ) : null}
            <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
                <code className={cn('font-mono text-foreground/90')}>{code}</code>
            </pre>
        </div>
    );
}
