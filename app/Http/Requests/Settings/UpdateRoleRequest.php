<?php

namespace App\Http\Requests\Settings;

use App\Concerns\RoleValidationRules;
use App\Models\Role;
use App\Support\PermissionRegistry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    use RoleValidationRules;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('roles.manage') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Role $role */
        $role = $this->route('role');

        $rules = $this->roleRules($role->id);

        if (in_array($role->name, PermissionRegistry::systemRoles(), true)) {
            $rules['name'] = ['required', 'string', 'in:'.$role->name];
        }

        return $rules;
    }
}
