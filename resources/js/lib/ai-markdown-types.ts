export type MarkdownBlock =
    | { type: 'paragraph'; text: string }
    | { type: 'heading'; level: number; text: string }
    | {
          type: 'list';
          ordered: boolean;
          items: { text: string; checked?: boolean }[];
      }
    | { type: 'code'; language: string; code: string }
    | { type: 'table'; headers: string[]; rows: string[][] }
    | { type: 'blockquote'; lines: string[]; variant: CalloutVariant }
    | { type: 'hr' }
    | { type: 'image'; alt: string; src: string };

export type CalloutVariant = 'default' | 'note' | 'tip' | 'warning' | 'important';

export type ChartSpec = {
    type?: 'bar' | 'line' | 'pie';
    title?: string;
    labels?: string[];
    values?: number[];
};

export type ProposedAction = {
    type: string;
    title?: string;
    payload?: Record<string, unknown>;
};

export type Citation = {
    type: string;
    label?: string;
    site_id?: string | number;
    alert_id?: number;
};

export type AiMessageEnrichment = {
    chart_spec?: ChartSpec | null;
    proposed_actions?: ProposedAction[] | null;
    citations?: Citation[] | null;
};
