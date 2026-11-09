import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }) {
    const { user, roles, logout, hasPermission } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setShowUserMenu(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const getInitials = (name) => {
        if (!name) return 'U';
        const words = name.trim().split(' ');
        let initials = '';
        for (const word of words) {
            if (word) initials += word[0].toUpperCase();
            if (initials.length >= 2) break;
        }
        return initials || 'U';
    };

    return (
        <div className="app-shell">
            {/* Decorative gradient blobs */}
            <div className="bg-blob bg-blob-1"></div>
            <div className="bg-blob bg-blob-2"></div>

            <header className="topbar">
                <div className="topbar-inner">

                    {/* Brand */}
                    <Link to="/dashboard" className="brand">
                        <div className="brand-logo">RP</div>
                        <div className="brand-name">
                            Role<span>Permission</span>
                        </div>
                    </Link>

                    {/* Nav */}
                    <nav className="nav-menu">
                        <Link
                            to="/dashboard"
                            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
                        >
                            Home
                        </Link>

                        {hasPermission('user-list') && (
                            <Link
                                to="/users"
                                className={`nav-item ${isActive('/users') ? 'active' : ''}`}
                            >
                                Users
                            </Link>
                        )}

                        {hasPermission('role-list') && (
                            <Link
                                to="/roles"
                                className={`nav-item ${isActive('/roles') ? 'active' : ''}`}
                            >
                                Roles
                            </Link>
                        )}

                        <Link
                            to="/profile"
                            className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                        >
                            Profile
                        </Link>
                    </nav>

                    {/* ✅ Theme Toggle & User Profile Wrapper */}
                    <div className="d-flex align-items-center gap-2 ms-auto">
                        
                        {/* ✅ Dark/Light Toggle Icon (Profile ke theek pehle) */}
                        <button
                            className="theme-toggle-btn"
                            onClick={toggleTheme}
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                            aria-label="Toggle theme"
                        >
                            {theme === 'light' ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            )}
                        </button>

                        {/* User Menu */}
                        <div className="profile-menu" ref={menuRef}>
                            <button
                                className="profile-trigger"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <div className="avatar-wrapper">
                                    <div className="avatar">
                                        {getInitials(user?.name)}
                                    </div>
                                    <span className="status-dot"></span>
                                </div>
                                <div className="profile-text">
                                    <span className="profile-name">{user?.name}</span>
                                    <span className="profile-role">{roles[0] || 'User'}</span>
                                </div>
                                <svg className={`arrow ${showUserMenu ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {showUserMenu && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-user">
                                        <div className="avatar avatar-lg">
                                            {getInitials(user?.name)}
                                        </div>
                                        <div className="dropdown-user-info">
                                            <strong>{user?.name}</strong>
                                            <small>{user?.email}</small>
                                        </div>
                                    </div>

                                    <div className="dropdown-sep"></div>

                                    <button className="dropdown-link" onClick={() => navigate('/profile')}>
                                        <span className="link-dot"></span>
                                        My Profile
                                    </button>

                                    <button className="dropdown-link" onClick={() => navigate('/dashboard')}>
                                        <span className="link-dot"></span>
                                        Home
                                    </button>

                                    <div className="dropdown-sep"></div>

                                    <button className="dropdown-link danger" onClick={handleLogout}>
                                        <span className="link-dot"></span>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </header>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}