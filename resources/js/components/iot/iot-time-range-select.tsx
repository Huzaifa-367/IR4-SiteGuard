import { router, usePage } from '@inertiajs/react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type IotTimeRangeFilters = {
    days: number;
    options: number[];
    label: string;
};

const OPTION_LABELS: Record<number, string> = {
    7: 'Last 7 days',
    30: 'Last 30 days',
    90: 'Last 90 days',
    180: 'Last 6 months',
    365: 'Last 12 months',
    0: 'All history',
};

function optionLabel(days: number): string {
    return OPTION_LABELS[days] ?? `Last ${days} days`;
}

type Props = {
    filters: IotTimeRangeFilters;
    className?: string;
};

export function IotTimeRangeSelect({ filters, className }: Props) {
    const { url } = usePage();

    return (
        <Select
            value={String(filters.days)}
            onValueChange={(value) => {
                const current = new URL(url, window.location.origin);
                const params: Record<string, string> = {};

                current.searchParams.forEach((paramValue, key) => {
                    if (key !== 'page') {
                        params[key] = paramValue;
                    }
                });

                params.days = value;

                router.get(current.pathname, params, {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                });
            }}
        >
            <SelectTrigger className={className ?? 'w-[180px]'}>
                <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
                {filters.options.map((days) => (
                    <SelectItem key={days} value={String(days)}>
                        {optionLabel(days)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function iotChartRangeLabel(chartDays: number, selectedDays: number): string {
    if (selectedDays === 0) {
        return 'All history';
    }
    if (chartDays > 180) {
        return `${chartDays} days (monthly)`;
    }
    if (chartDays > 60) {
        return `${chartDays} days (weekly)`;
    }

    return `${chartDays} days`;
}
