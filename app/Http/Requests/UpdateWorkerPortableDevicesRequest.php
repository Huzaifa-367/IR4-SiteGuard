<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkerPortableDevicesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('workers.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'portable_device_approved' => ['required', 'boolean'],
            'portable_devices' => ['present', 'array'],
            'portable_devices.*.type' => ['required', 'string', 'max:64'],
            'portable_devices.*.serial' => ['nullable', 'string', 'max:128'],
            'portable_devices.*.approved_at' => ['nullable', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'portable_device_approved' => $this->boolean('portable_device_approved'),
        ]);
    }
}
