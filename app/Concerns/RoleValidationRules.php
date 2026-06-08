<?php

namespace App\Concerns;

use App\Support\PermissionRegistry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

trait RoleValidationRules
{
    /**
     * Get the validation rules used to validate a role payload.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function roleRules(?int $roleId = null): array
    {
        return [
            'name' => $this->roleNameRules($roleId),
            'description' => ['nullable', 'string', 'max:255'],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(PermissionRegistry::all())],
        ];
    }

    /**
     * Get the validation rules used to validate role names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function roleNameRules(?int $roleId = null): array
    {
        return [
            'required',
            'string',
            'max:64',
            'regex:/^[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/',
            $roleId === null
                ? Rule::unique(Role::class, 'name')
                : Rule::unique(Role::class, 'name')->ignore($roleId),
        ];
    }
}
