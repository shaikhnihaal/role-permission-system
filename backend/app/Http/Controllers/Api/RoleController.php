<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search  = $request->get('search');

        $query = Role::with('permissions');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->orderBy('id', 'asc')->paginate($perPage);

        $roles->getCollection()->transform(function ($role) {
            return [
                'id'                 => $role->id,
                'name'               => $role->name,
                'guard_name'         => $role->guard_name,
                'permissions'        => $role->permissions->pluck('name'),
                'permissions_count'  => $role->permissions->count(),
                'users_count'        => User::role($role->name)->count(),
                'created_at'         => $role->created_at->format('Y-m-d H:i:s'),
                'updated_at'         => $role->updated_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'status' => true,
            'data'   => $roles,
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'          => 'required|string|max:100|unique:roles,name',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $role = Role::create([
            'name'       => $request->name,
            'guard_name' => 'api',
        ]);

        if ($request->has('permissions') && is_array($request->permissions)) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'status'  => true,
            'message' => 'Role created successfully',
            'data'    => [
                'id'                 => $role->id,
                'name'               => $role->name,
                'guard_name'         => $role->guard_name,
                'permissions'        => $role->permissions->pluck('name'),
                'permissions_count'  => $role->permissions->count(),
                'users_count'        => 0,
            ],
        ], 201);
    }

    public function show($id)
    {
        $role = Role::with('permissions')->find($id);

        if (!$role) {
            return response()->json([
                'status'  => false,
                'message' => 'Role not found',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data'   => [
                'id'                 => $role->id,
                'name'               => $role->name,
                'guard_name'         => $role->guard_name,
                'permissions'        => $role->permissions->pluck('name'),
                'permissions_count'  => $role->permissions->count(),
                'users_count'        => User::role($role->name)->count(),
                'users'              => User::role($role->name)->get(['id', 'name', 'email']),
                'created_at'         => $role->created_at->format('Y-m-d H:i:s'),
                'updated_at'         => $role->updated_at->format('Y-m-d H:i:s'),
            ],
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'status'  => false,
                'message' => 'Role not found',
            ], 404);
        }

        if ($role->name === 'Super Admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Super Admin role cannot be modified.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name'          => 'sometimes|required|string|max:100|unique:roles,name,' . $id,
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        if ($request->has('name')) {
            $role->name = $request->name;
            $role->save();
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions ?? []);
        }

        $role->load('permissions');

        return response()->json([
            'status'  => true,
            'message' => 'Role updated successfully',
            'data'    => [
                'id'                 => $role->id,
                'name'               => $role->name,
                'guard_name'         => $role->guard_name,
                'permissions'        => $role->permissions->pluck('name'),
                'permissions_count'  => $role->permissions->count(),
                'users_count'        => User::role($role->name)->count(),
            ],
        ], 200);
    }

    public function destroy($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'status'  => false,
                'message' => 'Role not found',
            ], 404);
        }

        if ($role->name === 'Super Admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Super Admin role cannot be deleted.',
            ], 403);
        }

        $usersCount = User::role($role->name)->count();
        if ($usersCount > 0) {
            return response()->json([
                'status'      => false,
                'message'     => "Cannot delete role. {$usersCount} user(s) still have this role.",
                'users_count' => $usersCount,
            ], 403);
        }

        $role->syncPermissions([]);
        $role->delete();

        return response()->json([
            'status'  => true,
            'message' => 'Role deleted successfully',
        ], 200);
    }

    public function syncPermissions(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'status'  => false,
                'message' => 'Role not found',
            ], 404);
        }

        if ($role->name === 'Super Admin') {
            return response()->json([
                'status'  => false,
                'message' => 'Super Admin role cannot be modified.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'permissions'   => 'required|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $role->syncPermissions($request->permissions);

        return response()->json([
            'status'  => true,
            'message' => 'Permissions synced successfully',
            'data'    => [
                'id'                 => $role->id,
                'name'               => $role->name,
                'permissions'        => $role->permissions->pluck('name'),
                'permissions_count'  => $role->permissions->count(),
            ],
        ], 200);
    }

    public function allPermissions()
    {
        $permissions = Permission::all()->groupBy(function ($perm) {
            $parts = explode('-', $perm->name);
            return $parts[0] ?? 'other';
        });

        return response()->json([
            'status' => true,
            'data'   => [
                'all'     => Permission::all()->pluck('name'),
                'grouped' => $permissions,
                'total'   => Permission::count(),
            ],
        ], 200);
    }
}