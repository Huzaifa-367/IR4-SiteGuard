import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

type DebouncedFilterOptions<T extends Record<string, string | number | null>> = {
    /** URL to reload when filters change (without query string). */
    url: string;
    /** Current filter inputs (kept in component state by the caller). */
    state: T;
    /**
     * Last-applied filter snapshot, normally the server-provided `filters`
     * prop. We bail out when state already matches it.
     */
    applied: Partial<T>;
    /** Inertia partial reload `only` keys to keep transfers small. */
    only?: string[];
    delay?: number;
};

/**
 * Debounces filter changes and pushes them into the URL/Inertia visit.
 * Pattern is borrowed from `all-accounts-table.tsx` but generalised so list
 * pages don't each re-implement it.
 */
export function useDebouncedFilter<
    T extends Record<string, string | number | null>,
>({ url, state, applied, only, delay = 300 }: DebouncedFilterOptions<T>) {
    // Track first paint so we don't fire a redundant reload on mount.
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;

            return;
        }

        const handle = window.setTimeout(() => {
            const params: Record<string, string> = {};

            for (const key of Object.keys(state) as Array<keyof T>) {
                const value = state[key];
                const stringified =
                    value === null || value === undefined ? '' : String(value);

                if (stringified !== '') {
                    params[String(key)] = stringified;
                }
            }

            const same = Object.keys({ ...state, ...applied }).every((k) => {
                const next = (state as Record<string, unknown>)[k];
                const prev = (applied as Record<string, unknown>)[k];
                const a = next === null || next === undefined ? '' : String(next);
                const b = prev === null || prev === undefined ? '' : String(prev);

                return a === b;
            });

            if (same) {
                return;
            }

            router.get(url, params, {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                only,
            });
        }, delay);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(state)]);
}
