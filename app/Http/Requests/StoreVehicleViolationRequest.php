<?php

namespace App\Http\Requests;

use App\Support\SiteScopedRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleViolationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('vehicle_violations.log') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'occurred_at' => ['required', 'date'],
            'vehicle_description' => ['required', 'string', 'max:255'],
            'equipment_asset_id' => ['nullable', 'integer', SiteScopedRules::exists('equipment_assets')],
            'violation_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('vehicle_violation_types'))],
            'description' => ['required', 'string', 'max:5000'],
            'actions_taken' => ['required', 'string', 'max:5000'],
        ];
    }
}
