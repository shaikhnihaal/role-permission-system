<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Exception;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware('role:Super Admin,Admin')
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            if (!$user) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Unauthenticated. User not found.',
                ], 401);
            }

            // Check karo user ke paas in roles mein se koi ek hai ya nahi
            if (!$user->hasAnyRole($roles)) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Forbidden. You do not have the required role.',
                    'required_roles' => $roles,
                    'your_roles'     => $user->getRoleNames(),
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