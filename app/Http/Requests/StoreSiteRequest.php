<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSiteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('sites.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:64', 'unique:sites,code'],
            'timezone' => ['required', 'string', 'max:64'],
            'address' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['active', 'archived'])],
        ];
    }
}
