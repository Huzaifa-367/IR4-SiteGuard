import { FileText, MapPin } from 'lucide-react';
import type { Citation } from '@/lib/ai-markdown-types';
import { normalizeCitations } from '@/lib/normalize-ai-enrichment';

type AiContentCitationsProps = {
    citations: Citation[] | unknown;
};

function citationLabel(citation: Citation): string {
    if (typeof citation.label === 'string' && citation.label.trim() !== '') {
        return citation.label;
    }

    const type = typeof citation.type === 'string' && citation.type !== '' ? citation.type : 'source';

    if (type === 'alert' && typeof citation.alert_id === 'number') {
        return `Alert #${citation.alert_id}`;
    }

    return type.replace(/_/g, ' ');
}

export default function AiContentCitations({ citations }: AiContentCitationsProps) {
    const items = normalizeCitations(citations);

    if (items.length === 0) {
        return null;
    }

    return (
        <section className="mt-3 border-t border-border/60 pt-3">
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="size-3.5" aria-hidden />
                Sources
            </h4>
            <ul className="flex flex-wrap gap-2">
                {items.map((citation, index) => (
                    <li
                        key={`${citation.type}-${index}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-xs text-foreground/90"
                    >
                        <MapPin className="size-3 text-muted-foreground" aria-hidden />
                        {citationLabel(citation)}
                    </li>
                ))}
            </ul>
        </section>
    );
}
