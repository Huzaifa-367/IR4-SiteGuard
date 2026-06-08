<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRfidZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('rfid_zones.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:64'],
            'zone_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('rfid_zone_types'))],
            'max_occupancy' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['is_active' => true]);
    }
}
