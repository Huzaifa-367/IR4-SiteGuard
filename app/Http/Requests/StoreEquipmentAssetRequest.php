<?php

namespace App\Http\Requests;

use App\Support\SelectedSiteManager;
use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentAssetRequest extends FormRequest
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
        $site = app(SelectedSiteManager::class)->requireSelectedSite($this);

        return [
            'equipment_id' => [
                'required',
                'string',
                'max:64',
                Rule::unique('equipment_assets', 'equipment_id')->where(fn ($q) => $q->where('site_id', $site->id)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'equipment_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('equipment_types'))],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'serial_number' => ['nullable', 'string', 'max:255'],
            'location_note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
