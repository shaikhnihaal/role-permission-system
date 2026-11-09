<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Exception;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware('permission:user-create')
     *        ->middleware('permission:user-list,user-edit')  // ANY one match
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Unauthenticated. User not found.',
                ], 401);
            }

            // Super Admin bypass — usko sab allow hai
            if ($user->hasRole('Super Admin')) {
                return $next($request);
            }

            // Check karo user ke paas in permissions mein se koi ek hai ya nahi
            if (!$user->hasAnyPermission($permissions)) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Forbidden. You do not have the required permission.',
                    'required_permissions' => $permissions,
                    'your_permissions'     => $user->getAllPermissions()->pluck('name'),
                ], 403);
            }

        } catch (Exception $e) {
            return response()->json([
                'status'  => false,
                'message' => 'Unauthorized. Token invalid or missing.',
                'error'   => $e->getMessage(),
            ], 401);
        }

        return $next($request);
    }
}