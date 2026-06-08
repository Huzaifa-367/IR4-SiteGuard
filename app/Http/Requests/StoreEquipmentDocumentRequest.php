<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentDocumentRequest extends FormRequest
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
            'document_type' => ['required', Rule::in(SiteGuardEnums::keys('document_types'))],
            'title' => ['required', 'string', 'max:255'],
            'file' => ['required_without:external_url', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png'],
            'external_url' => ['required_without:file', 'nullable', 'url', 'max:2048'],
        ];
    }
}
