<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEdgeDeviceRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:64'],
            'mount_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('mount_types'))],
        ];
    }
}
