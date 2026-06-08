<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateUserRoleRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;

class UserRoleController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('permission:users.manage', only: ['update']),
        ];
    }

    /**
     * The dedicated "User roles" page has been merged into the combined
     * Roles & Permissions index. This endpoint stays around so any bookmarked
     * URLs (or generated Wayfinder links) still work, and forwards the search
     * and role filters along.
     */
    public function index(Request $request): RedirectResponse
    {
        return to_route('roles.index', $request->only(['search', 'role']));
    }

    /**
     * Update the role assigned to the given user (single role per user).
     */
    public function update(UpdateUserRoleRequest $request, User $user): RedirectResponse
    {
        $user->syncRoles([$request->validated('role')]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('User role updated.')]);

        return back();
    }
}
