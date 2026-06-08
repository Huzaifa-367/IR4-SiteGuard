import AiContentActions from '@/components/ai/ai-content-actions';
import AiContentChart from '@/components/ai/ai-content-chart';
import AiContentCitations from '@/components/ai/ai-content-citations';
import type { AiMessageEnrichment } from '@/lib/ai-markdown-types';
import { normalizeCitations, normalizeProposedActions } from '@/lib/normalize-ai-enrichment';

type AiMessageEnrichmentProps = AiMessageEnrichment;

export default function AiMessageEnrichmentPanel({
    chart_spec,
    proposed_actions,
    citations,
}: AiMessageEnrichmentProps) {
    const hasChart =
        chart_spec &&
        Array.isArray(chart_spec.labels) &&
        chart_spec.labels.length > 0 &&
        Array.isArray(chart_spec.values) &&
        chart_spec.values.length > 0;

    const actions = normalizeProposedActions(proposed_actions);
    const citationList = normalizeCitations(citations);

    if (! hasChart && actions.length === 0 && citationList.length === 0) {
        return null;
    }

    return (
        <div className="mt-1 space-y-1">
            {hasChart ? <AiContentChart spec={chart_spec} /> : null}
            <AiContentCitations citations={citationList} />
            <AiContentActions actions={actions} />
        </div>
    );
}
