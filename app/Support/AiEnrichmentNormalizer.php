<?php

namespace App\Support;

class AiEnrichmentNormalizer
{
    /**
     * @return list<array{type: string, label?: string, site_id?: int|string, alert_id?: int}>
     */
    public static function citations(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $normalized = [];

        foreach ($raw as $item) {
            if (is_string($item) && trim($item) !== '') {
                $normalized[] = [
                    'type' => $item,
                    'label' => str_replace('_', ' ', $item),
                ];

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            $type = isset($item['type']) && is_string($item['type']) && $item['type'] !== ''
                ? $item['type']
                : 'source';

            $entry = ['type' => $type];

            if (isset($item['label']) && is_string($item['label'])) {
                $entry['label'] = $item['label'];
            }

            if (isset($item['site_id']) && (is_int($item['site_id']) || is_string($item['site_id']))) {
                $entry['site_id'] = $item['site_id'];
            }

            if (isset($item['alert_id']) && is_int($item['alert_id'])) {
                $entry['alert_id'] = $item['alert_id'];
            }

            $normalized[] = $entry;
        }

        return $normalized;
    }

    /**
     * @return list<array{type: string, title?: string, payload?: array<string, mixed>}>
     */
    public static function proposedActions(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $normalized = [];

        foreach ($raw as $item) {
            if (is_string($item) && trim($item) !== '') {
                $normalized[] = [
                    'type' => $item,
                    'title' => str_replace('_', ' ', $item),
                ];

                continue;
            }

            if (! is_array($item)) {
                continue;
            }

            $type = isset($item['type']) && is_string($item['type']) && $item['type'] !== ''
                ? $item['type']
                : 'action';

            $entry = ['type' => $type];

            if (isset($item['title']) && is_string($item['title'])) {
                $entry['title'] = $item['title'];
            }

            if (isset($item['payload']) && is_array($item['payload'])) {
                $entry['payload'] = $item['payload'];
            }

            $normalized[] = $entry;
        }

        return $normalized;
    }
}
