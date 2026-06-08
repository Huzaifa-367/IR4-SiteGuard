<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\Site;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:users.view', only: ['index']),
            new Middleware('permission:users.manage', only: ['store', 'update']),
        ];
    }

    public function index(Request $request): Response
    {
        $users = User::query()
            ->with(['roles:id,name', 'sites:id,name'])
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_active' => $user->is_active,
                'roles' => $user->roles->pluck('name')->all(),
                'sites' => $user->sites->pluck('name')->all(),
                'site_ids' => $user->sites->pluck('id')->all(),
            ]);

        return Inertia::render('users/index', [
            'users' => $users,
            'sites' => Site::query()->orderBy('name')->get(['id', 'name']),
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'canManage' => $request->user()?->can('users.manage') ?? false,
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_active' => $validated['is_active'],
            'email_verified_at' => now(),
        ]);

        $this->syncUserAccess($user, $validated['role'], $validated['site_ids'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User created.')]);

        return to_route('users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        $attributes = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'is_active' => $validated['is_active'],
        ];

        if (! empty($validated['password'])) {
            $attributes['password'] = $validated['password'];
        }

        $user->update($attributes);

        $this->syncUserAccess($user, $validated['role'], $validated['site_ids'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User updated.')]);

        return to_route('users.index');
    }

    /**
     * @param  list<int>  $siteIds
     */
    private function syncUserAccess(User $user, string $role, array $siteIds): void
    {
        $user->syncRoles([$role]);

        if ($user->can('sites.access_all')) {
            $user->sites()->detach();

            return;
        }

        $sync = collect($siteIds)
            ->mapWithKeys(fn (int $id): array => [$id => ['is_primary' => false]])
            ->all();

        $user->sites()->sync($sync);
    }
}
