<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\StoreRoleRequest;
use App\Http\Requests\Settings\UpdateRoleRequest;
use App\Models\Role;
use App\Models\User;
use App\Support\PermissionRegistry;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller implements HasMiddleware
{
    /**
     * Maximum number of users to surface in each role's avatar stack.
     */
    private const PREVIEW_USERS = 5;

    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:roles.view', only: ['index', 'edit']),
            new Middleware('permission:roles.manage', only: ['create', 'store', 'update', 'destroy']),
        ];
    }

    /**
     * Show the combined "Roles & Permissions" page: role cards on top and the
     * paginated "All accounts" table beneath. The user table is only included
     * when the caller has the `users.view` permission.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $canViewUsers = $user !== null && $user->can('users.view');
        $canAssignRoles = $user !== null && $user->can('users.manage');

        $search = trim((string) $request->string('search'));
        $roleFilter = trim((string) $request->string('role'));

        return Inertia::render('roles/index', [
            'roles' => $this->listRoles(),
            'permissionGroups' => $this->permissionGroups(),
            'systemRoles' => PermissionRegistry::systemRoles(),
            'users' => $canViewUsers
                ? $this->paginateUsers($search, $roleFilter)
                : null,
            'assignableRoles' => $canViewUsers ? $this->assignableRoles() : [],
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'permissionsFlags' => [
                'canViewUsers' => $canViewUsers,
                'canAssignRoles' => $canAssignRoles,
            ],
        ]);
    }

    /**
     * Show the form to create a new role.
     *
     * The roles index renders the create flow inside a dialog, so navigating
     * here directly just bounces back to the list with the dialog auto-opened.
     */
    public function create(): RedirectResponse
    {
        return to_route('roles.index', ['action' => 'create']);
    }

    /**
     * Persist a new role.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role created.')]);

        return to_route('roles.index');
    }

    /**
     * Show the form to edit a role and its permissions.
     *
     * Editing happens inline through a dialog on the roles index; direct
     * navigation here funnels the user back with the role pre-selected.
     */
    public function edit(Role $role): RedirectResponse
    {
        return to_route('roles.index', ['edit' => $role->id]);
    }

    /**
     * Update an existing role and sync its permissions.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();

        $role->fill([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ])->save();

        $role->syncPermissions($validated['permissions'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role updated.')]);

        return to_route('roles.index');
    }

    /**
     * Remove a role.
     *
     * @throws AuthorizationException
     */
    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system || in_array($role->name, PermissionRegistry::systemRoles(), true)) {
            throw new AuthorizationException(__('System roles cannot be deleted.'));
        }

        $role->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Role deleted.')]);

        return to_route('roles.index');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function listRoles(): array
    {
        return Role::query()
            ->withCount(['users', 'permissions'])
            ->with(['users' => fn ($query) => $query->select('users.id', 'users.name')->limit(self::PREVIEW_USERS)])
            ->orderBy('name')
            ->get()
            ->map(fn (Role $role) => $this->presentRole($role))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function presentRole(Role $role): array
    {
        $previewUsers = $role->relationLoaded('users')
            ? $role->users
            : $role->users()->limit(self::PREVIEW_USERS)->get(['users.id', 'users.name']);

        return [
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->description,
            'permissions' => $role->permissions()->pluck('name')->all(),
            'users_count' => (int) ($role->users_count ?? $role->users()->count()),
            'permissions_count' => (int) ($role->permissions_count ?? $role->permissions()->count()),
            'is_system' => (bool) $role->is_system || in_array($role->name, PermissionRegistry::systemRoles(), true),
            'users_preview' => $previewUsers
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * Paginated "All accounts" listing used by the combined roles page.
     */
    private function paginateUsers(string $search, string $roleFilter): LengthAwarePaginator
    {
        return User::query()
            ->with('roles:id,name')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($roleFilter !== '' && $roleFilter !== 'all', function ($query) use ($roleFilter): void {
                $query->whereHas('roles', fn ($q) => $q->where('name', $roleFilter));
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(fn (Role $role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ])->all(),
            ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function assignableRoles(): array
    {
        return Role::query()
            ->orderBy('name')
            ->get(['id', 'name', 'description'])
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function permissionGroups(): array
    {
        return collect(PermissionRegistry::groups())
            ->map(fn (array $group, string $key) => [
                'key' => $key,
                'label' => $group['label'],
                'description' => $group['description'],
                'permissions' => collect($group['permissions'])
                    ->map(fn (string $label, string $name) => [
                        'name' => $name,
                        'label' => $label,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }
}
