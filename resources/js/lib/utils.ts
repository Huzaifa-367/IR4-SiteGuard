import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

/** Render a numeric quantity (up to 4 decimals, trims trailing zeros). */
export function formatQty(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '0';
    }

    const n = typeof value === 'string' ? Number(value) : value;

    if (Number.isNaN(n)) {
        return String(value);
    }

    return numberFormatter.format(n);
}

/** Render money with 2-decimal precision and optional currency suffix. */
export function formatMoney(
    value: string | number | null | undefined,
    currency = 'AED',
): string {
    if (value === null || value === undefined || value === '') {
        return `${currency} 0.00`;
    }

    const n = typeof value === 'string' ? Number(value) : value;

    if (Number.isNaN(n)) {
        return `${currency} ${value}`;
    }

    return `${currency} ${decimalFormatter.format(n)}`;
}

/** Pretty-prints `partially_received` etc. as `Partially Received`. */
export function humanise(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    return value
        .toString()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
