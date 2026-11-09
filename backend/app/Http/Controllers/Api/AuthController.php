<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{



    // ============================================
    // REGISTER
    // ============================================
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'required|in:Super Admin,Admin,Manager,User',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Role create karne ki permission check karo (sirf Super Admin & Admin)
        $currentUser = Auth::guard('api')->user();

        // Agar user logged in hai to hi role assign kar sakta hai (except public registration)
        // Public register pe "User" role hi allow karo — baaki ke liye Super Admin chahiye
        if ($request->role !== 'User') {
            if (!$currentUser || !$currentUser->hasAnyRole(['Super Admin', 'Admin'])) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Only Super Admin or Admin can assign this role.',
                ], 403);
            }
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'status'   => 'active',
        ]);

        $user->assignRole($request->role);

        $token = Auth::guard('api')->login($user);

        return $this->respondWithToken($token, 'User registered successfully', $user);
    }

    // ============================================
    // LOGIN
    // ============================================
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        // JWT attempt
        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        // Status check karo
        $user = Auth::guard('api')->user();
        if ($user->status !== 'active') {
            Auth::guard('api')->logout();
            return response()->json([
                'status'  => false,
                'message' => 'Your account is inactive. Please contact admin.',
            ], 403);
        }

        return $this->respondWithToken($token, 'Login successful', $user);
    }

    // ============================================
    // PROFILE (Current Logged-in User)
    // ============================================
    public function profile()
    {
        $user = Auth::guard('api')->user();

        return response()->json([
            'status' => true,
            'data'   => [
                'user'        => $user,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ], 200);
    }

    // ============================================
    // LOGOUT
    // ============================================
    public function logout()
    {
        Auth::guard('api')->logout();

        return response()->json([
            'status'  => true,
            'message' => 'Successfully logged out',
        ], 200);
    }

    // ============================================
    // REFRESH TOKEN
    // ============================================
    public function refresh()
    {
        $token = Auth::guard('api')->refresh();

        return $this->respondWithToken($token, 'Token refreshed successfully', Auth::guard('api')->user());
    }

    // ============================================
    // Helper: Token Response
    // ============================================
    protected function respondWithToken($token, $message, $user = null)
    {
        $user = $user ?? Auth::guard('api')->user();

        return response()->json([
            'status'       => true,
            'message'      => $message,
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => Auth::guard('api')->factory()->getTTL() * 60, // seconds
            'user'         => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
            ],
            'roles'        => $user->getRoleNames(),
            'permissions'  => $user->getAllPermissions()->pluck('name'),
        ], 200);
    }
}