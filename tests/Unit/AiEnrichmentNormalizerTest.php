<?php

namespace Tests\Unit;

use App\Support\AiEnrichmentNormalizer;
use PHPUnit\Framework\TestCase;

class AiEnrichmentNormalizerTest extends TestCase
{
    public function test_it_normalizes_string_citations(): void
    {
        $result = AiEnrichmentNormalizer::citations(['alerts', 'cameras']);

        $this->assertSame([
            ['type' => 'alerts', 'label' => 'alerts'],
            ['type' => 'cameras', 'label' => 'cameras'],
        ], $result);
    }

    public function test_it_normalizes_citations_missing_type(): void
    {
        $result = AiEnrichmentNormalizer::citations([
            ['label' => 'Alerts inbox'],
        ]);

        $this->assertSame('source', $result[0]['type']);
        $this->assertSame('Alerts inbox', $result[0]['label']);
    }
}
