<?php

use App\Http\Controllers\Settings\RoleController;
use App\Http\Controllers\Settings\UserRoleController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return Auth::check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('user-roles', [UserRoleController::class, 'index'])
        ->name('user-roles.index');

    Route::put('user-roles/{user}', [UserRoleController::class, 'update'])
        ->name('user-roles.update');

    Route::resource('roles', RoleController::class)
        ->except(['show']);
});

require __DIR__.'/siteguard.php';
require __DIR__.'/settings.php';
