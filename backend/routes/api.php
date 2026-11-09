<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ProfileController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ============================
// PUBLIC ROUTES
// ============================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

// ============================
// PROTECTED ROUTES (JWT required)
// ============================
Route::middleware('auth:api')->group(function () {

    // ------------------------------------------------
    // AUTH
    // ------------------------------------------------
    Route::get('/profile',  [AuthController::class, 'profile']);
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

     // ------------------------------------------------
    // MY PROFILE (self-service)
    // ------------------------------------------------
    Route::prefix('my-profile')->group(function () {
        Route::get('/',                 [ProfileController::class, 'show']);
        Route::put('/',                 [ProfileController::class, 'update']);
        Route::post('/change-password', [ProfileController::class, 'changePassword']);
    });


    // ------------------------------------------------
    // DASHBOARD
    // ------------------------------------------------
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ================================================
    // USER MANAGEMENT
    // ================================================
    Route::prefix('users')->group(function () {

        Route::middleware('permission:user-list')->group(function () {
            Route::get('/',      [UserController::class, 'index']);
            Route::get('/{id}',  [UserController::class, 'show']);
        });

        Route::middleware('permission:user-create')->group(function () {
            Route::post('/', [UserController::class, 'store']);
        });

        Route::middleware('permission:user-edit')->group(function () {
            Route::put('/{id}',   [UserController::class, 'update']);
            Route::patch('/{id}', [UserController::class, 'update']);
            Route::post('/{id}/assign-role', [UserController::class, 'assignRole']);
            Route::post('/{id}/remove-role', [UserController::class, 'removeRole']);
        });

        Route::middleware('permission:user-delete')->group(function () {
            Route::delete('/{id}', [UserController::class, 'destroy']);
        });
    });

    // ================================================
    // ROLE MANAGEMENT
    // ================================================
    Route::prefix('roles')->group(function () {

        Route::middleware('permission:role-list')->group(function () {
            Route::get('/',      [RoleController::class, 'index']);
            Route::get('/{id}',  [RoleController::class, 'show']);
        });

        Route::middleware('permission:role-create')->group(function () {
            Route::post('/', [RoleController::class, 'store']);
        });

        Route::middleware('permission:role-edit')->group(function () {
            Route::put('/{id}',   [RoleController::class, 'update']);
            Route::patch('/{id}', [RoleController::class, 'update']);
            Route::post('/{id}/permissions', [RoleController::class, 'syncPermissions']);
        });

        Route::middleware('permission:role-delete')->group(function () {
            Route::delete('/{id}', [RoleController::class, 'destroy']);
        });
    });

    // ================================================
    // PERMISSIONS (for role form)
    // ================================================
    Route::get('/permissions', [RoleController::class, 'allPermissions'])
        ->middleware('permission:role-list');

});