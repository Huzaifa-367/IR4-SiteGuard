<?php

namespace App\Http\Requests;

use App\Models\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule as ValidationRule;

class UpdateRuleRequest extends FormRequest
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
        /** @var Rule $rule */
        $rule = $this->route('rule');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'severity' => ['sometimes', 'required', ValidationRule::in(['low', 'medium', 'high', 'critical'])],
            'definition' => ['sometimes', 'required', 'array'],
            'definition.match' => ['required_with:definition', 'string'],
            'dwell_sec' => ['nullable', 'integer', 'min:0'],
            'cooldown_sec' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
