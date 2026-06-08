<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use App\Support\SiteScopedRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSensorDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sensors.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'edge_device_id' => ['nullable', 'integer', SiteScopedRules::exists('edge_devices')],
            'device_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('sensor_device_types'))],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:64'],
        ];
    }
}
