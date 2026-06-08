<?php

namespace App\Support;

use App\Models\Rule;
use Illuminate\Database\Eloquent\Builder;

class SiteRuleResolver
{
    public static function activeByMatch(int $siteId, string $match): ?Rule
    {
        return Rule::query()
            ->where('site_id', $siteId)
            ->where('is_active', true)
            ->where('definition->match', $match)
            ->first();
    }

    public static function lsrCategory(?Rule $rule): ?string
    {
        $match = self::definitionMatch($rule);

        if ($match === null) {
            return null;
        }

        return config("siteguard.rule_match_to_lsr.{$match}");
    }

    public static function gasRuleMatchForParameter(string $parameter): ?string
    {
        return config("siteguard.gas_parameter_to_rule_match.{$parameter}");
    }

    public static function incidentTypeFor(?Rule $rule): string
    {
        $match = self::definitionMatch($rule);

        if ($match !== null) {
            $fromMatch = config("siteguard.rule_match_to_incident_type.{$match}");

            if (is_string($fromMatch)) {
                return $fromMatch;
            }
        }

        return SiteGuardEnums::incidentTypeForRule($rule?->code);
    }

    public static function correlationWindowSeconds(): int
    {
        return (int) config('siteguard.correlation_window_seconds', 30);
    }

    /**
     * @return list<string>
     */
    public static function correlationMatches(string $type): array
    {
        $matches = config("siteguard.correlation_rule_matches.{$type}", []);

        return is_array($matches) ? array_values($matches) : [];
    }

    public static function ruleHasMatch(?Rule $rule, string|array $matches): bool
    {
        $match = self::definitionMatch($rule);

        if ($match === null) {
            return false;
        }

        $needles = is_array($matches) ? $matches : [$matches];

        return in_array($match, $needles, true);
    }

    /**
     * @param  Builder<Rule>  $query
     * @return Builder<Rule>
     */
    public static function scopeRulesByMatch(Builder $query, string|array $matches): Builder
    {
        $needles = is_array($matches) ? $matches : [$matches];

        return $query->where(function (Builder $inner) use ($needles): void {
            foreach ($needles as $match) {
                $inner->orWhere('definition->match', $match);
            }
        });
    }

    public static function isRestrictedZoneType(?string $zoneType): bool
    {
        if ($zoneType === null) {
            return false;
        }

        return in_array($zoneType, config('siteguard.restricted_zone_types', ['restricted']), true);
    }

    public static function stationaryThresholdSeconds(?Rule $rule): int
    {
        $dwell = is_array($rule?->definition) ? ($rule->definition['dwell_sec'] ?? null) : null;

        if (is_numeric($dwell)) {
            return (int) $dwell;
        }

        return (int) config('siteguard.rfid_stationary_min_seconds', 1200);
    }

    private static function definitionMatch(?Rule $rule): ?string
    {
        if ($rule === null || ! is_array($rule->definition)) {
            return null;
        }

        $match = $rule->definition['match'] ?? null;

        return is_string($match) ? $match : null;
    }
}
