<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // GET /api/users
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search  = $request->get('search');
        $role    = $request->get('role');
        $status  = $request->get('status');

        $query = User::with('roles');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('roles', function ($roleQuery) use ($search) {
                        $roleQuery->where('name', 'like', "%{$search}%");
                    });
                });
            } 

        if ($status) {
            $query->where('status', $status);
        }

        if ($role) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        $users = $query->orderBy('id', 'desc')->paginate($perPage);

        $users->getCollection()->transform(function ($user) {
            return [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'status'      => $user->status,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'created_at'  => $user->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'status' => true,
            'data'   => $users,
        ], 200);
    }

    // POST /api/users
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|max:100',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role'     => 'required|string|exists:roles,name',
            'status'   => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $currentUser = auth('api')->user();
        if ($request->role === 'Super Admin' && !$currentUser->hasRole('Super Admin')) {
            return response()->json([
                'status'  => false,
                'message' => 'Only Super Admin can assign Super Admin role.',
            ], 403);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'status'   => $request->status ?? 'active',
        ]);

        $user->assignRole($request->role);

        return response()->json([
            'status'  => true,
            'message' => 'User created successfully',
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'status'      => $user->status,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ], 201);
    }

    // GET /api/users/{id}
    public function show($id)
    {
        $user = User::with('roles', 'permissions')->find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'status'          => $user->status,
                'email_verified'  => $user->email_verified_at,
                'roles'           => $user->getRoleNames(),
                'permissions'     => $user->getAllPermissions()->pluck('name'),
                'created_at'      => $user->created_at->format('Y-m-d H:i:s'),
                'updated_at'      => $user->updated_at->format('Y-m-d H:i:s'),
            ],
        ], 200);
    }

    // PUT /api/users/{id}
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name'     => 'sometimes|required|string|max:100',
            'email'    => ['sometimes', 'required', 'email', Rule::unique('users', 'email')->ignore($id)],
            'password' => 'sometimes|required|string|min:6|confirmed',
            'status'   => 'sometimes|in:active,inactive',
            'role'     => 'sometimes|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $currentUser = auth('api')->user();
        if ($request->has('role')) {
            if ($request->role === 'Super Admin' && !$currentUser->hasRole('Super Admin')) {
                return response()->json([
                    'status'  => false,
                    'message' => 'Only Super Admin can assign Super Admin role.',
                ], 403);
            }
        }

        if ($request->has('name'))     $user->name = $request->name;
        if ($request->has('email'))    $user->email = $request->email;
        if ($request->has('status'))   $user->status = $request->status;
        if ($request->filled('password')) $user->password = Hash::make($request->password);

        $user->save();

        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'status'  => true,
            'message' => 'User updated successfully',
            'data'    => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'status'      => $user->status,
                'roles'       => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ], 200);
    }

    // DELETE /api/users/{id}
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found',
            ], 404);
        }

        if (auth('api')->id() === $user->id) {
            return response()->json([
                'status'  => false,
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        if ($user->hasRole('Super Admin')) {
            return response()->json([
                'status'  => false,
                'message' => 'Super Admin cannot be deleted.',
            ], 403);
        }

        $user->syncRoles([]);
        $user->delete();

        return response()->json([
            'status'  => true,
            'message' => 'User deleted successfully',
        ], 200);
    }

    // POST /api/users/{id}/assign-role
    public function assignRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found',
            ], 404);
        }

        $currentUser = auth('api')->user();
        if ($request->role === 'Super Admin' && !$currentUser->hasRole('Super Admin')) {
            return response()->json([
                'status'  => false,
                'message' => 'Only Super Admin can assign Super Admin role.',
            ], 403);
        }

        $user->assignRole($request->role);

        return response()->json([
            'status'  => true,
            'message' => "Role '{$request->role}' assigned successfully",
            'roles'   => $user->getRoleNames(),
        ], 200);
    }

    // POST /api/users/{id}/remove-role
    public function removeRole(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::find($id);
        if (!$user) {
            return response()->json([
                'status'  => false,
                'message' => 'User not found',
            ], 404);
        }

        $user->removeRole($request->role);

        return response()->json([
            'status'  => true,
            'message' => "Role '{$request->role}' removed successfully",
            'roles'   => $user->getRoleNames(),
        ], 200);
    }
}