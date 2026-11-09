<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Cache clear (bahut zaroori hai warna purane roles cached rehte hain)
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ============================
        // 1. Permissions Create Karo
        // ============================
        $permissions = [
            // User management
            'user-list', 'user-create', 'user-edit', 'user-delete',
            // Role management
            'role-list', 'role-create', 'role-edit', 'role-delete',
            // Product module (example)
            'product-list', 'product-create', 'product-edit', 'product-delete',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ============================
        // 2. 4 Roles Create Karo
        // ============================
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
        $adminRole      = Role::firstOrCreate(['name' => 'Admin']);
        $managerRole    = Role::firstOrCreate(['name' => 'Manager']);
        $userRole       = Role::firstOrCreate(['name' => 'User']);

        // ============================
        // 3. Permissions Assign Karo
        // ============================

        // Super Admin => Sab kuch
        $superAdminRole->syncPermissions(Permission::all());

        // Admin => Users + Roles (read) + Products (full)
        $adminRole->syncPermissions([
            'user-list', 'user-create', 'user-edit',
            'role-list',
            'product-list', 'product-create', 'product-edit', 'product-delete',
        ]);

        // Manager => Users (read) + Products (no delete)
        $managerRole->syncPermissions([
            'user-list',
            'product-list', 'product-create', 'product-edit',
        ]);

        // User => Sirf Product list
        $userRole->syncPermissions([
            'product-list',
        ]);

        // ============================
        // 4. Super Admin User Banao
        // ============================
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            [
                'name'     => 'Super Admin',
                'password' => Hash::make('password'),
                'status'   => 'active',
            ]
        );
        $superAdmin->assignRole('Super Admin');

        // ============================
        // 5. Test Users (har role ka ek)
        // ============================
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => Hash::make('password'), 'status' => 'active']
        );
        $admin->assignRole('Admin');

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            ['name' => 'Manager User', 'password' => Hash::make('password'), 'status' => 'active']
        );
        $manager->assignRole('Manager');

        $user = User::firstOrCreate(
            ['email' => 'user@example.com'],
            ['name' => 'Normal User', 'password' => Hash::make('password'), 'status' => 'active']
        );
        $user->assignRole('User');

        $this->command->info('✅ Roles, Permissions & Users created successfully!');
    }
}