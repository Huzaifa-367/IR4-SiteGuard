<?php

namespace App\Http\Requests;

use App\Support\SiteScopedRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreGasGatewayRequest extends FormRequest
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
            'edge_device_id' => ['required', 'integer', SiteScopedRules::exists('edge_devices')],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:64'],
            'vehicle_label' => ['nullable', 'string', 'max:255'],
        ];
    }
}
