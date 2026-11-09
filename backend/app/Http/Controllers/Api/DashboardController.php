<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::guard('api')->user();

        $data = [
            'user' => [
                'id'     => $user->id,
                'name'   => $user->name,
                'email'  => $user->email,
                'status' => $user->status,
            ],
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];

        if ($user->hasRole('Super Admin')) {
            $data['stats'] = $this->getSuperAdminStats();
            $data['widgets'] = [
                'can_manage_users'  => true,
                'can_manage_roles'  => true,
                'can_view_reports'  => true,
            ];
            $data['charts'] = $this->getChartsData();
            $data['recent_users'] = $this->getRecentUsers();
            $data['activity_timeline'] = $this->getActivityTimeline();

        } elseif ($user->hasRole('Admin')) {
            $data['stats'] = $this->getAdminStats();
            $data['widgets'] = [
                'can_manage_users'  => true,
                'can_manage_roles'  => false,
                'can_view_reports'  => true,
            ];
            $data['charts'] = $this->getChartsData();
            $data['recent_users'] = $this->getRecentUsers();

        } elseif ($user->hasRole('Manager')) {
            $data['stats'] = $this->getManagerStats();
            $data['widgets'] = [
                'can_manage_users'  => false,
                'can_manage_roles'  => false,
                'can_view_reports'  => true,
            ];
        } else {
            $data['stats'] = $this->getUserStats();
            $data['widgets'] = [
                'can_manage_users'  => false,
                'can_manage_roles'  => false,
                'can_view_reports'  => false,
            ];
        }

        return response()->json([
            'status'  => true,
            'message' => 'Dashboard data fetched successfully',
            'data'    => $data,
        ], 200);
    }

    private function getSuperAdminStats()
    {
        return [
            'total_users'       => User::count(),
            'active_users'      => User::where('status', 'active')->count(),
            'inactive_users'    => User::where('status', 'inactive')->count(),
            'total_roles'       => Role::count(),
            'total_permissions' => Permission::count(),
            'new_users_this_month' => User::whereMonth('created_at', now()->month)
                                        ->whereYear('created_at', now()->year)
                                        ->count(),
        ];
    }

    private function getAdminStats()
    {
        return [
            'total_users'       => User::count(),
            'active_users'      => User::where('status', 'active')->count(),
            'inactive_users'    => User::where('status', 'inactive')->count(),
            'total_roles'       => Role::count(),
            'new_users_this_month' => User::whereMonth('created_at', now()->month)
                                        ->whereYear('created_at', now()->year)
                                        ->count(),
        ];
    }

    private function getManagerStats()
    {
        return [
            'total_users' => User::count(),
            'team_size'   => User::whereHas('roles', function ($q) {
                $q->whereIn('name', ['Manager', 'User']);
            })->count(),
        ];
    }

        private function getUserStats()
    {
        // Normal user ko koi special stats nahi chahiye
        return [];
    }

    private function getChartsData()
    {
        // Last 6 months user growth
        $userGrowth = [];
        $labels = [];

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $labels[] = $date->format('M Y');
            $userGrowth[] = User::whereYear('created_at', $date->year)
                                ->whereMonth('created_at', $date->month)
                                ->count();
        }

        // Role distribution
        $roleDistribution = [];
        $roleLabels = [];
        $roleColors = [
            '#3b82f6', // blue
            '#10b981', // green
            '#f59e0b', // yellow
            '#ef4444', // red
            '#8b5cf6', // purple
            '#ec4899', // pink
        ];

        $roles = Role::withCount('users')->get();
        foreach ($roles as $role) {
            $roleLabels[] = $role->name;
            $roleDistribution[] = $role->users_count;
        }

        return [
            'user_growth' => [
                'labels' => $labels,
                'data'   => $userGrowth,
            ],
            'role_distribution' => [
                'labels' => $roleLabels,
                'data'   => $roleDistribution,
                'colors' => array_slice($roleColors, 0, count($roleLabels)),
            ],
        ];
    }

    private function getRecentUsers()
    {
        return User::with('roles')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id'         => $user->id,
                    'name'       => $user->name,
                    'email'      => $user->email,
                    'status'     => $user->status,
                    'roles'      => $user->getRoleNames(),
                    'initials'   => $this->getInitials($user->name),
                    'created_at' => $user->created_at->diffForHumans(),
                ];
            });
    }

    private function getActivityTimeline()
    {
        // Recent users as activity (create events)
        $activities = [];

        $recentUsers = User::latest()->take(5)->get();
        foreach ($recentUsers as $user) {
            $activities[] = [
                'type'        => 'user_created',
                'icon'        => '👤',
                'color'       => 'success',
                'title'       => 'New user registered',
                'description' => $user->name . ' (' . $user->email . ')',
                'time'        => $user->created_at->diffForHumans(),
                'created_at'  => $user->created_at->format('Y-m-d H:i:s'),
            ];
        }

        // Sort by latest
        usort($activities, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return array_slice($activities, 0, 5);
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