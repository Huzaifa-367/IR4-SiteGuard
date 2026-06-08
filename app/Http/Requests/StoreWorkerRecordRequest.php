<?php

namespace App\Http\Requests;

use App\Support\SiteScopedRules;
use Illuminate\Foundation\Http\FormRequest;

class StoreWorkerRecordRequest extends FormRequest
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
            'tag_epc' => ['required', 'string', 'max:64', SiteScopedRules::unique('worker_records', 'tag_epc')],
            'full_name' => ['required', 'string', 'max:255'],
            'contractor' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'nationality' => ['nullable', 'string', 'max:128'],
            'portable_device_approved' => ['boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'portable_device_approved' => $this->boolean('portable_device_approved'),
            'is_active' => true,
        ]);
    }
}
