<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLsrViolationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('lsr.log_manual') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lsr_category' => ['required', 'string', Rule::in(array_keys(SiteGuardEnums::lsrManualCategories()))],
            'occurred_at' => ['required', 'date'],
            'description' => ['required', 'string', 'max:5000'],
            'actions_taken' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
