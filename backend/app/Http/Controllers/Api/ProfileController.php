<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::guard('api')->user();

        return response()->json([
            'status' => true,
            'data'   => [
                'id'                 => $user->id,
                'name'               => $user->name,
                'email'              => $user->email,
                'status'             => $user->status,
                'email_verified_at'  => $user->email_verified_at,
                'roles'              => $user->getRoleNames(),
                'permissions'        => $user->getAllPermissions()->pluck('name'),
                'permissions_count'  => $user->getAllPermissions()->count(),
                'created_at'         => $user->created_at->format('Y-m-d H:i:s'),
                'updated_at'         => $user->updated_at->format('Y-m-d H:i:s'),
                'member_since'       => $user->created_at->diffForHumans(),
                'initials'           => $this->getInitials($user->name),
            ],
        ], 200);
    }

    public function update(Request $request)
    {
        $user = Auth::guard('api')->user();

        $validator = Validator::make($request->all(), [
            'name'  => 'sometimes|required|string|max:100',
            'email' => [
                'sometimes',
                'required',
                'email',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        if ($request->has('name')) {
            $user->name = $request->name;
        }
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        $user->save();

        return response()->json([
            'status'  => true,
            'message' => 'Profile updated successfully',
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'initials'    => $this->getInitials($user->name),
            ],
        ], 200);
    }

    public function changePassword(Request $request)
    {
        $user = Auth::guard('api')->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password'         => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status'  => false,
                'message' => 'Current password is incorrect',
                'errors'  => [
                    'current_password' => ['The current password is incorrect.'],
                ],
            ], 422);
        }

        if ($request->current_password === $request->password) {
            return response()->json([
                'status'  => false,
                'message' => 'New password must be different from current password',
                'errors'  => [
                    'password' => ['New password must be different from current password.'],
                ],
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'status'  => true,
            'message' => 'Password changed successfully',
        ], 200);
    }

    private function getInitials($name)
    {
        $words = explode(' ', trim($name));
        $initials = '';

        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper($word[0]);
            }
            if (strlen($initials) >= 2) break;
        }

        return $initials ?: 'U';
    }
}