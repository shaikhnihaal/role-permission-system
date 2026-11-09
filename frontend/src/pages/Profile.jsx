import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import EditProfileModal from '../components/EditProfileModal';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/my-profile');
            if (res.data.status) {
                setProfile(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);



    const handleEditSuccess = (message) => {
        showToast(message, 'success');
        fetchProfile();
        if (profile) {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...storedUser, name: profile.name }));
        }
        setTimeout(() => window.location.reload(), 800);
    };

    const handlePasswordSuccess = (message) => {
        showToast(message, 'success');
    };

    if (loading) {
        return (
            <Layout>
                <div className="up-loading" style={{ minHeight: '60vh' }}>
                    <div className="up-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </Layout>
        );
    }

    if (!profile) {
        return (
            <Layout>
                <div className="up-empty" style={{ minHeight: '60vh' }}>
                    <div className="up-empty-icon">⚠️</div>
                    <h4>Failed to load profile</h4>
                    <p>Please refresh the page or try again later.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>

            {/* Main Profile Hero Card */}
            <div className="pf-hero">
                <div className="pf-hero-bg"></div>
                <div className="pf-hero-content">
                    <div className="pf-avatar-wrapper">
                        <div className="pf-avatar-large">{profile.initials}</div>
                        <span className="pf-status-indicator"></span>
                    </div>

                    <div className="pf-hero-info">
                        <h1 className="pf-name">{profile.name}</h1>
                        <p className="pf-email">{profile.email}</p>

                        <div className="pf-badges">
                            {profile.roles.map(role => (
                                <span key={role} className="pf-role-badge">
                                    🎭 {role}
                                </span>
                            ))}
                            <span className={`pf-status-badge ${profile.status === 'active' ? 'active' : 'inactive'}`}>
                                <span className="pf-dot"></span>
                                {profile.status}
                            </span>
                        </div>

                        <div className="pf-joined">
                            📅 Member since {profile.member_since}
                        </div>
                    </div>

                    <div className="pf-hero-actions">
                        <button className="up-btn-primary" onClick={() => setShowEditModal(true)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="pf-grid">
                <div className="pf-info-card">
                    <div className="pf-info-icon">👤</div>
                    <div className="pf-info-text">
                        <span className="pf-info-label">Full Name</span>
                        <span className="pf-info-value">{profile.name}</span>
                    </div>
                </div>

                <div className="pf-info-card">
                    <div className="pf-info-icon">📧</div>
                    <div className="pf-info-text">
                        <span className="pf-info-label">Email Address</span>
                        <span className="pf-info-value" style={{ wordBreak: 'break-all' }}>{profile.email}</span>
                    </div>
                </div>

                <div className="pf-info-card">
                    <div className="pf-info-icon">📅</div>
                    <div className="pf-info-text">
                        <span className="pf-info-label">Account Created</span>
                        <span className="pf-info-value">
                            {new Date(profile.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>

                <div className="pf-info-card">
                    <div className="pf-info-icon">🔄</div>
                    <div className="pf-info-text">
                        <span className="pf-info-label">Last Updated</span>
                        <span className="pf-info-value">
                            {new Date(profile.updated_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Security Card */}
            <div className="pf-section-card">
                <div className="pf-section-header">
                    <div className="pf-section-title">
                        <div className="pf-section-icon">🔐</div>
                        <div>
                            <h5>Security</h5>
                            <p>Update your password regularly to keep your account secure.</p>
                        </div>
                    </div>
                    <button className="pf-btn-outline" onClick={() => setShowPasswordModal(true)}>
                        Change Password
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Permissions Card */}
            <div className="pf-section-card">
                <div className="pf-section-header border-bottom">
                    <div className="pf-section-title">
                        <div className="pf-section-icon">🔑</div>
                        <div>
                            <h5>My Permissions</h5>
                            <p>All the permissions assigned to your roles.</p>
                        </div>
                    </div>
                    <span className="pf-count-badge">{profile.permissions_count} total</span>
                </div>
                <div className="pf-permissions-body">
                    {profile.permissions.length === 0 ? (
                        <p className="text-muted mb-0">No permissions assigned.</p>
                    ) : (
                        <div className="pf-perm-grid">
                            {profile.permissions.map(p => (
                                <span key={p} className="pf-perm-badge">{p}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Roles Card */}
            <div className="pf-section-card">
                <div className="pf-section-header border-bottom">
                    <div className="pf-section-title">
                        <div className="pf-section-icon">🎭</div>
                        <div>
                            <h5>My Roles</h5>
                            <p>Roles assigned to your account.</p>
                        </div>
                    </div>
                    <span className="pf-count-badge">{profile.roles.length} total</span>
                </div>
                <div className="pf-roles-body">
                    {profile.roles.map(r => (
                        <div key={r} className="pf-role-card">
                            <div className="pf-role-icon">🎭</div>
                            <span className="pf-role-name">{r}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            <EditProfileModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSuccess={handleEditSuccess}
                user={profile}
            />

            <ChangePasswordModal
                show={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={handlePasswordSuccess}
            />
        </Layout>
    );
}