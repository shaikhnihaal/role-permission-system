import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Dashboard() {
    const { user, roles, permissions } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/dashboard')
            .then((res) => setData(res.data.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="up-loading" style={{ minHeight: '60vh' }}>
                    <div className="up-spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </Layout>
        );
    }

    const stats = data?.stats || {};
    const widgets = data?.widgets || {};
    const charts = data?.charts || null;
    const recentUsers = data?.recent_users || [];
    const activities = data?.activity_timeline || [];

    const statCards = [
        { key: 'total_users',            label: 'Total Users',       color: 'primary', icon: '👥' },
        { key: 'active_users',           label: 'Active Users',      color: 'success', icon: '✅' },
        { key: 'inactive_users',         label: 'Inactive Users',    color: 'danger',  icon: '⛔' },
        { key: 'total_roles',            label: 'Total Roles',       color: 'warning', icon: '🎭' },
        { key: 'total_permissions',      label: 'Permissions',       color: 'info',    icon: '🔑' },
        { key: 'new_users_this_month',   label: 'New This Month',    color: 'dark',    icon: '📈' },
        { key: 'team_size',              label: 'Team Size',         color: 'secondary', icon: '👨‍👩‍👧' },
        { key: 'joined_days',            label: 'Days Since Join',   color: 'dark',    icon: '📅' },
    ].filter(c => stats[c.key] !== undefined);

    // Line Chart Data
    const lineChartData = charts ? {
        labels: charts.user_growth.labels,
        datasets: [
            {
                label: 'New Users',
                data: charts.user_growth.data,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            },
        ],
    } : null;

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 13 },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1, precision: 0 },
                grid: { color: 'rgba(241, 245, 249, 0.5)' },
            },
            x: {
                grid: { display: false },
            },
        },
    };

    // Doughnut Chart Data
    const doughnutData = charts ? {
        labels: charts.role_distribution.labels,
        datasets: [
            {
                data: charts.role_distribution.data,
                backgroundColor: charts.role_distribution.colors,
                borderWidth: 3,
                borderColor: '#fff',
                hoverOffset: 8,
            },
        ],
    } : null;

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    font: { size: 12, weight: 600 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    color: '#64748b',
                },
            },
            tooltip: {
                backgroundColor: '#0f172a',
                padding: 12,
                cornerRadius: 8,
            },
        },
        cutout: '65%',
    };

    return (
        <Layout>
            {/* Welcome Banner */}
            <div className="db-header">
                <div className="db-header-left">
                    <div className="db-header-icon"></div>
                    <div>
                        <h2 className="db-title">Welcome back, {user?.name}</h2>
                        <p className="db-subtitle">
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                            })}
                            <span className="ms-2 text-muted">• </span>
                            Role : <span className="up-role-badge ms-1">{roles[0] || 'No Role'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {/* Stats Cards OR Welcome Banner for Normal User */}
            {statCards.length > 0 ? (
                <div className="row g-3 mb-4">
                    {statCards.map((card) => (
                        <div className="col-xl-3 col-lg-4 col-md-6" key={card.key}>
                            <div className={`db-stat-card db-stat-${card.color}`}>
                                <div className="db-stat-content">
                                    <div className="db-stat-label">{card.label}</div>
                                    <div className="db-stat-value">{stats[card.key]}</div>
                                </div>
                                <div className="db-stat-icon">{card.icon}</div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ✅ Normal User ke liye Premium Welcome Card */
                <div className="db-welcome-card mb-4">
                    <div className="db-welcome-content">
                        <div className="db-welcome-icon">👋</div>
                        <div>
                            <h4 className="mb-1" style={{ color: 'var(--text-primary)' }}>
                                Welcome to your Dashboard
                            </h4>
                            <p className="mb-0" style={{ color: 'var(--text-secondary)' }}>
                                You are logged in as a <strong>User</strong>. You can view your profile and update your settings from here.
                            </p>
                        </div>
                    </div>
                    <div className="db-welcome-actions">
                        <button className="up-btn-primary" onClick={() => navigate('/profile')}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            View Profile
                        </button>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            {charts && (
                <div className="row g-3 mb-4">
                    {/* Line Chart */}
                    <div className="col-lg-8">
                        <div className="up-card h-100">
                            <div className="up-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
                                <strong className="mb-0" style={{ fontSize: '15px' }}>📈 User Growth (Last 6 Months)</strong>
                            </div>
                            <div className="card-body p-3">
                                <div style={{ height: '280px' }}>
                                    <Line data={lineChartData} options={lineChartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Doughnut Chart */}
                    <div className="col-lg-4">
                        <div className="up-card h-100">
                            <div className="up-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
                                <strong className="mb-0" style={{ fontSize: '15px' }}>🎭 Role Distribution</strong>
                            </div>
                            <div className="card-body p-3 d-flex align-items-center justify-content-center">
                                <div style={{ height: '280px', width: '100%' }}>
                                    <Doughnut data={doughnutData} options={doughnutOptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Users + Activity */}
            {(recentUsers.length > 0 || activities.length > 0) && (
                <div className="row g-3 mb-4">
                    {/* Recent Users */}
                    {recentUsers.length > 0 && (
                        <div className="col-lg-6">
                            <div className="up-card h-100">
                                <div className="up-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong className="mb-0" style={{ fontSize: '15px' }}>🕒 Recent Users</strong>
                                    <button className="btn btn-sm btn-outline-primary" style={{ fontSize: '12px', borderRadius: '8px' }} onClick={() => navigate('/users')}>
                                        View All
                                    </button>
                                </div>
                                <div className="p-0">
                                    {recentUsers.map((u, idx) => (
                                        <div
                                            key={u.id}
                                            className="d-flex align-items-center gap-3 px-4 py-3"
                                            style={{
                                                borderBottom: idx < recentUsers.length - 1 ? '1px solid rgba(241,245,249,0.8)' : 'none'
                                            }}
                                        >
                                            <div className="up-avatar" style={{ width: '36px', height: '36px', fontSize: '12px', borderRadius: '10px' }}>
                                                {u.initials}
                                            </div>
                                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                    <div className="fw-semibold text-truncate" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{u.name}</div>
                                                    <small className="db-text-muted text-truncate d-block" style={{ fontSize: '12px' }}>{u.email}</small>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`up-status ${u.status === 'active' ? 'up-status-active' : 'up-status-inactive'}`}>
                                                        <span className="up-status-dot"></span>
                                                        {u.status}
                                                    </span>
                                                    <div className="small db-text-muted mt-1" style={{ fontSize: '11px' }}>{u.created_at}</div>
                                                </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    {activities.length > 0 && (
                        <div className="col-lg-6">
                            <div className="up-card h-100">
                                <div className="up-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
                                    <strong className="mb-0" style={{ fontSize: '15px' }}>⚡ Recent Activity</strong>
                                </div>
                                <div className="card-body p-4">
                                    <div className="activity-timeline">
                                        {activities.map((activity, idx) => (
                                            <div key={idx} className="activity-item">
                                                <div className="activity-dot" style={{ background: '#6366f1', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
                                                    {activity.icon}
                                                </div>
                                                <div className="activity-content">
                                                    <div className="fw-semibold" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{activity.title}</div>
                                                    <div className="db-text-muted small" style={{ fontSize: '13px' }}>{activity.description}</div>
                                                    <div className="db-text-muted mt-1" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        🕒 {activity.time}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="up-card mb-4">
                <div className="up-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                    <strong className="mb-0" style={{ fontSize: '15px' }}>⚡ Quick Actions</strong>
                </div>
                <div className="card-body p-4">
                    <div className="d-flex flex-wrap gap-2">
                        {widgets.can_manage_users && (
                            <button className="up-btn-primary" onClick={() => navigate('/users')}>
                                👥 Manage Users
                            </button>
                        )}
                        {widgets.can_manage_roles && (
                            <button className="up-btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', boxShadow: '0 6px 16px rgba(245, 158, 11, 0.35)' }} onClick={() => navigate('/roles')}>
                                🎭 Manage Roles
                            </button>
                        )}
                        {widgets.can_view_reports && (
                            <button className="up-btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 6px 16px rgba(6, 182, 212, 0.35)' }}>
                                📊 View Reports
                            </button>
                        )}
                        
                        {/* ✅ Normal User ke liye Profile Button (Agar koi aur action nahi hai) */}
                        {!widgets.can_manage_users && !widgets.can_manage_roles && !widgets.can_view_reports && (
                            <button className="db-btn-outline" onClick={() => navigate('/profile')}>
                                👤 My Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* My Permissions */}
            <div className="up-card">
                <div className="up-header" style={{ padding: '16px 20px', borderBottom: '1px solid rgba(226,232,240,0.6)' }}>
                    <strong className="mb-0" style={{ fontSize: '15px' }}>🔑 My Permissions ({permissions.length})</strong>
                </div>
                <div className="card-body p-4">
                    {permissions.length === 0 ? (
                        <p className="text-muted mb-0">No permissions assigned.</p>
                    ) : (
                        <div className="d-flex flex-wrap gap-2">
                           {permissions.map(p => (
                                <span key={p} className="pf-perm-badge">{p}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}