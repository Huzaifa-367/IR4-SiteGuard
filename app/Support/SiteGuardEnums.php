<?php

namespace App\Support;

class SiteGuardEnums
{
    /**
     * @return list<string>
     */
    public static function keys(string $group): array
    {
        $value = config("siteguard_enums.{$group}");

        if (! is_array($value)) {
            return [];
        }

        return array_keys($value);
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(string $group): array
    {
        $value = config("siteguard_enums.{$group}");

        if (! is_array($value)) {
            return [];
        }

        return collect($value)->map(function (mixed $label, string $key): array {
            if (is_array($label)) {
                return [
                    'value' => $key,
                    'label' => (string) ($label['label'] ?? $key),
                ];
            }

            return [
                'value' => $key,
                'label' => (string) $label,
            ];
        })->values()->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public static function lsrAutomatedCategories(): array
    {
        return collect(config('siteguard_enums.lsr_categories', []))
            ->filter(fn (array $meta): bool => ($meta['mode'] ?? '') === 'automated')
            ->map(fn (array $meta, string $code): array => [
                'code' => $code,
                'name' => $meta['label'],
                'method' => $meta['method'] ?? 'Automated',
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, string>
     */
    public static function lsrManualCategories(): array
    {
        return collect(config('siteguard_enums.lsr_categories', []))
            ->filter(fn (array $meta): bool => ($meta['mode'] ?? '') === 'manual')
            ->mapWithKeys(fn (array $meta, string $code): array => [$code => $meta['label']])
            ->all();
    }

    public static function incidentTypeForRule(?string $ruleCode): string
    {
        if ($ruleCode === null) {
            return 'safety_alert';
        }

        return config("siteguard_enums.rule_code_to_incident_type.{$ruleCode}", 'safety_alert');
    }

    public static function label(string $group, ?string $key): string
    {
        if ($key === null) {
            return '—';
        }

        $value = config("siteguard_enums.{$group}.{$key}");

        if (is_array($value)) {
            return (string) ($value['label'] ?? $key);
        }

        return is_string($value) ? $value : $key;
    }
}
