import type { Citation, ProposedAction } from '@/lib/ai-markdown-types';

export function normalizeCitations(raw: unknown): Citation[] {
    if (! Array.isArray(raw)) {
        return [];
    }

    return raw.flatMap((item): Citation[] => {
        if (typeof item === 'string' && item.trim() !== '') {
            return [
                {
                    type: item,
                    label: item.replace(/_/g, ' '),
                },
            ];
        }

        if (item && typeof item === 'object' && ! Array.isArray(item)) {
            const record = item as Record<string, unknown>;
            const type = typeof record.type === 'string' ? record.type : 'source';

            return [
                {
                    type,
                    label: typeof record.label === 'string' ? record.label : undefined,
                    site_id:
                        typeof record.site_id === 'string' || typeof record.site_id === 'number'
                            ? record.site_id
                            : undefined,
                    alert_id: typeof record.alert_id === 'number' ? record.alert_id : undefined,
                },
            ];
        }

        return [];
    });
}

export function normalizeProposedActions(raw: unknown): ProposedAction[] {
    if (! Array.isArray(raw)) {
        return [];
    }

    return raw.flatMap((item): ProposedAction[] => {
        if (typeof item === 'string' && item.trim() !== '') {
            return [{ type: item, title: item.replace(/_/g, ' ') }];
        }

        if (item && typeof item === 'object' && ! Array.isArray(item)) {
            const record = item as Record<string, unknown>;
            const type = typeof record.type === 'string' ? record.type : 'action';

            return [
                {
                    type,
                    title: typeof record.title === 'string' ? record.title : undefined,
                    payload:
                        record.payload && typeof record.payload === 'object'
                            ? (record.payload as Record<string, unknown>)
                            : undefined,
                },
            ];
        }

        return [];
    });
}
