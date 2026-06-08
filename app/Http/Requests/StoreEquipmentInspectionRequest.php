<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentInspectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('equipment.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'inspected_at' => ['required', 'date'],
            'inspector_name' => ['required', 'string', 'max:255'],
            'outcome' => ['required', Rule::in(SiteGuardEnums::keys('inspection_outcomes'))],
            'notes' => ['nullable', 'string', 'max:2000'],
            'next_inspection_due' => ['nullable', 'date', 'after_or_equal:inspected_at'],
        ];
    }
}
