<?php

namespace App\Http\Requests;

use App\Support\SiteGuardEnums;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassifyHseIncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('hse_incidents.classify') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'incident_type' => ['required', 'string', Rule::in(SiteGuardEnums::keys('hse_incident_types'))],
            'severity' => ['required', 'string', Rule::in(SiteGuardEnums::keys('hse_severities'))],
            'root_cause_category' => ['required', 'string', Rule::in(SiteGuardEnums::keys('hse_root_cause_categories'))],
            'nature_of_incident' => ['required', 'string', 'max:5000'],
            'immediate_action_taken' => ['required', 'string', 'max:5000'],
            'corrective_action' => ['required', 'string', 'max:5000'],
            'actions_taken' => ['required', 'string', 'max:5000'],
        ];
    }
}
