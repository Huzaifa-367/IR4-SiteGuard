<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentMaintenanceRequest extends FormRequest
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
            'performed_at' => ['required', 'date'],
            'maintenance_type' => ['required', Rule::in(SiteGuardEnums::keys('maintenance_types'))],
            'description' => ['required', 'string', 'max:2000'],
            'performed_by' => ['nullable', 'string', 'max:255'],
            'next_service_due' => ['nullable', 'date', 'after_or_equal:performed_at'],
        ];
    }
}
