import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('superadmin@example.com');
    const [password, setPassword] = useState('password');
    const [showPassword, setShowPassword] = useState(false);
    const [showTestAccounts, setShowTestAccounts] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(email, password);
            if (data.status) {
                navigate('/dashboard');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const fillAccount = (accEmail) => {
        setEmail(accEmail);
        setPassword('password');
        setShowTestAccounts(false);
    };

    const testAccounts = [
        { email: 'superadmin@example.com', role: 'Super Admin', color: 'primary' },
        { email: 'admin@example.com',      role: 'Admin',       color: 'info' },
        { email: 'manager@example.com',    role: 'Manager',     color: 'warning' },
        { email: 'user@example.com',       role: 'User',        color: 'secondary' },
    ];

    return (
        <div className="login-page">

            <div className="login-blob login-blob-1"></div>
            <div className="login-blob login-blob-2"></div>
            <div className="login-blob login-blob-3"></div>

            <div className="login-grid-overlay"></div>

            <div className="login-container">

                {/* LEFT — Branding */}
                <div className="login-branding">
                    <div className="branding-inner">
                        <div className="branding-logo">
                            <div className="logo-mark">RP</div>
                            <div className="logo-text">
                                Role<span>Permission</span>
                            </div>
                        </div>

                        <h1 className="branding-title">
                            Welcome to the<br />
                            <span className="gradient-text">Access Control</span><br />
                            System
                        </h1>

                        <p className="branding-subtitle">
                            Secure role-based authentication with granular permissions.
                            Manage users, roles and access with ease.
                        </p>

                        <div className="branding-features">
                            <div className="feature-item">
                                <div className="feature-icon">🔐</div>
                                <div>
                                    <strong>JWT Security</strong>
                                    <small>Token-based auth</small>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">🎭</div>
                                <div>
                                    <strong>Role Based</strong>
                                    <small>4 access levels</small>
                                </div>
                            </div>
                            <div className="feature-item">
                                <div className="feature-icon">⚡</div>
                                <div>
                                    <strong>Fast & Modern</strong>
                                    <small>Built with React</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Login Form */}
                <div className="login-form-wrapper">
                    <div className="login-card">

                        <div className="login-card-header">
                            <h2>Sign in</h2>
                            <p>Enter your credentials to continue</p>
                        </div>

                        {error && (
                            <div className="login-error">
                                <span className="error-icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">

                            {/* Email — No Left Icon */}
                            <div className="input-group-modern">
                                <label>Email Address</label>
                                <div className="input-wrapper-simple">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password — No Left Icon, SVG Eye */}
                            <div className="input-group-modern">
                                <label>Password</label>
                                <div className="input-wrapper-simple">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password-svg"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            /* Eye Off (hide) */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        ) : (
                                            /* Eye (show) */
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="login-submit-btn"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        Sign in
                                        <span className="btn-arrow">→</span>
                                    </>
                                )}
                            </button>

                        </form>

                        <div className="test-accounts-section">
                            <button
                                type="button"
                                className="test-toggle"
                                onClick={() => setShowTestAccounts(!showTestAccounts)}
                            >
                                <span>🧪 Test Accounts</span>
                                <span className={`test-arrow ${showTestAccounts ? 'open' : ''}`}>▼</span>
                            </button>

                            {showTestAccounts && (
                                <div className="test-accounts-list">
                                    {testAccounts.map(acc => (
                                        <button
                                            key={acc.email}
                                            type="button"
                                            className="test-account-item"
                                            onClick={() => fillAccount(acc.email)}
                                        >
                                            <div className="test-account-info">
                                                <span className="test-email">{acc.email}</span>
                                                <span className={`badge bg-${acc.color}`}>{acc.role}</span>
                                            </div>
                                            <span className="test-use">Use →</span>
                                        </button>
                                    ))}
                                    <div className="test-note">
                                        Password for all: <code>password</code>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="login-footer">
                            <span>🛡️ Secured with JWT Authentication</span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}