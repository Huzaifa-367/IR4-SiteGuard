<?php

namespace App\Http\Requests;

use App\Support\SelectedSiteManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('rules.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $site = app(SelectedSiteManager::class)->requireSelectedSite($this);

        return [
            'detection_module_id' => ['required', 'integer', 'exists:detection_modules,id'],
            'code' => ['required', 'string', 'max:32', Rule::unique('rules', 'code')->where('site_id', $site->id)],
            'name' => ['required', 'string', 'max:255'],
            'severity' => ['required', Rule::in(['low', 'medium', 'high', 'critical'])],
            'definition' => ['required', 'array'],
            'definition.match' => ['required', 'string'],
            'dwell_sec' => ['nullable', 'integer', 'min:0'],
            'cooldown_sec' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
