<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use App\Support\SiteScopedRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRfidReaderRequest extends FormRequest
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
            'rfid_zone_id' => ['required', 'integer', SiteScopedRules::exists('rfid_zones')],
            'edge_device_id' => ['nullable', 'integer', SiteScopedRules::exists('edge_devices')],
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:64'],
            'mount_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('mount_types'))],
            'ip_address' => ['nullable', 'string', 'max:45'],
        ];
    }
}
