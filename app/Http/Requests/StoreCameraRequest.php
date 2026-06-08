<?php

namespace App\Http\Requests;

use App\Models\Site;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCameraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('cameras.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Site $site */
        $site = $this->route('site');

        return [
            'detection_module_id' => ['required', 'integer', 'exists:detection_modules,id'],
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'nullable',
                'string',
                'max:64',
                Rule::unique('cameras', 'code')->where('site_id', $site->id),
            ],
            'location_label' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
