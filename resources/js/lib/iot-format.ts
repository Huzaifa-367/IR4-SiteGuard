/** Shared IoT display helpers — no hardcoded business IDs. */

export function truncateLabel(text: string, max = 18): string {
    if (text.length <= max) {
        return text;
    }

    return `${text.slice(0, max - 1)}…`;
}

export function formatCompactTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return iso;
    }

    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) {
        return 'just now';
    }

    if (diffMin < 60) {
        return `${diffMin}m ago`;
    }

    const diffHr = Math.floor(diffMin / 60);

    if (diffHr < 24) {
        return `${diffHr}h ago`;
    }

    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatHumanLabel(value: string): string {
    return value
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type HealthTone = 'success' | 'warning' | 'danger' | 'muted';

export function healthTone(status: string | null | undefined): HealthTone {
    const normalized = (status ?? '').toLowerCase();

    if (['online', 'active', 'normal', 'approved', 'classified', 'accounted', 'pass', 'automated', 'closed', 'acknowledged'].includes(normalized)) {
        return 'success';
    }

    if (['offline', 'degraded', 'stale', 'pending', 'pending_classification', 'draft', 'unknown', 'partial', 'open'].includes(normalized)) {
        return 'warning';
    }

    if (
        ['critical', 'high_alarm', 'low_alarm', 'stel', 'twa', 'unaccounted', 'danger', 'fail'].includes(normalized)
        || normalized.includes('alarm')
    ) {
        return 'danger';
    }

    return 'muted';
}

export function utilizationTone(pct: number | null | undefined): HealthTone {
    if (pct === null || pct === undefined) {
        return 'muted';
    }

    if (pct >= 100) {
        return 'danger';
    }

    if (pct >= 80) {
        return 'warning';
    }

    return 'success';
}

export function lelSeverityColor(
    lel: number,
    thresholds?: { low?: number; high?: number },
): string {
    const high = thresholds?.high ?? 20;
    const low = thresholds?.low ?? 10;

    if (lel >= high) {
        return 'hsl(var(--destructive))';
    }

    if (lel >= low) {
        return '#F59E0B';
    }

    return '#10B981';
}

export const CHART_PALETTE = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#8B5CF6',
    '#06B6D4',
    '#EF4444',
    '#EC4899',
    '#64748B',
] as const;

export function paletteColor(index: number): string {
    return CHART_PALETTE[index % CHART_PALETTE.length];
}
