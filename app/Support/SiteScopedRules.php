<?php

namespace App\Support;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Illuminate\Validation\Rules\Unique;

class SiteScopedRules
{
    public static function exists(string $table, string $column = 'id'): Exists
    {
        $site = app(SelectedSiteManager::class)->requireSelectedSite(request());

        return Rule::exists($table, $column)->where('site_id', $site->id);
    }

    public static function unique(string $table, string $column): Unique
    {
        $site = app(SelectedSiteManager::class)->requireSelectedSite(request());

        return Rule::unique($table, $column)->where('site_id', $site->id);
    }
}
