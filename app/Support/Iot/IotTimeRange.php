<?php

namespace App\Support\Iot;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IotTimeRange
{
    /**
     * @return list<int>
     */
    public static function chartOptions(): array
    {
        /** @var list<int> */
        return config('siteguard.iot_ui.chart_days_options', [7, 30, 90, 180, 365, 0]);
    }

    /**
     * @return list<int>
     */
    public static function listOptions(): array
    {
        return self::chartOptions();
    }

    public static function chartDaysFromRequest(Request $request): int
    {
        return self::resolveSelectedDays(
            $request,
            (int) config('siteguard.iot_ui.chart_days_default', 90),
            self::chartOptions(),
            forChart: true,
        );
    }

    public static function listDaysFromRequest(Request $request): int
    {
        return self::chartDaysFromRequest($request);
    }

    /**
     * Selected days from the query string (0 = all history).
     */
    public static function selectedDaysFromRequest(Request $request, bool $forChart = true): int
    {
        $default = $forChart
            ? (int) config('siteguard.iot_ui.chart_days_default', 90)
            : (int) config('siteguard.iot_ui.list_days_default', 90);
        $allowed = $forChart ? self::chartOptions() : self::listOptions();

        if (! $request->has('days')) {
            return $default;
        }

        $days = $request->integer('days');

        return in_array($days, $allowed, true) ? $days : $default;
    }

    public static function effectiveChartDays(int $selectedDays): int
    {
        if ($selectedDays === 0) {
            return (int) config('siteguard.iot_ui.chart_days_max', 548);
        }

        return min($selectedDays, (int) config('siteguard.iot_ui.chart_days_max', 548));
    }

    public static function since(?int $days): ?CarbonImmutable
    {
        if ($days === 0) {
            return null;
        }

        return CarbonImmutable::now()->subDays($days)->startOfDay();
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>|Relation<TModel, *, *>  $query
     * @return Builder<TModel>|Relation<TModel, *, *>
     */
    public static function applySince(Builder|Relation $query, string $column, ?int $days): Builder|Relation
    {
        $since = self::since($days);

        if ($since !== null) {
            $query->where($column, '>=', $since);
        }

        return $query;
    }

    public static function perPage(): int
    {
        return (int) config('siteguard.iot_ui.list_per_page', 50);
    }

    public static function label(int $selectedDays): string
    {
        if ($selectedDays === 0) {
            return 'All history';
        }

        return "{$selectedDays} days";
    }

    /**
     * @return array{days: int, options: list<int>, label: string}
     */
    public static function chartFilters(Request $request): array
    {
        $selected = self::selectedDaysFromRequest($request, forChart: true);

        return [
            'days' => $selected,
            'options' => self::chartOptions(),
            'label' => self::label($selected),
        ];
    }

    /**
     * @return array{days: int, options: list<int>, label: string}
     */
    public static function listFilters(Request $request): array
    {
        return self::chartFilters($request);
    }

    /**
     * Hourly trend window derived from the selected list/chart range.
     */
    public static function hourlyTrendHours(int $selectedDays): int
    {
        if ($selectedDays === 0) {
            return 24;
        }

        if ($selectedDays <= 3) {
            return $selectedDays * 24;
        }

        return 24;
    }

    /**
     * SQL expression grouping a datetime column by calendar day (driver-aware).
     */
    public static function dateBucketExpression(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "strftime('%Y-%m-%d', {$column})",
            'pgsql' => "to_char({$column}, 'YYYY-MM-DD')",
            default => "DATE_FORMAT({$column}, '%Y-%m-%d')",
        };
    }

    /**
     * @param  list<int>  $allowed
     */
    private static function resolveSelectedDays(Request $request, int $default, array $allowed, bool $forChart): int
    {
        $selected = self::selectedDaysFromRequest($request, forChart: $forChart);

        if (! in_array($selected, $allowed, true)) {
            return $default;
        }

        return $selected;
    }
}
