import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';

// ============================================
// Custom Select Component (Portal-based)
// ============================================
function CustomSelect({ value, options, onChange, placeholder, disabled, hasError, loading }) {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const wrapperRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Calculate dropdown position
    const updateDropdownPosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const dropHeight = 260;

            const openUpward = spaceBelow < dropHeight && spaceAbove > spaceBelow;

            setDropdownStyle({
                position: 'fixed',
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                top: openUpward ? 'auto' : `${rect.bottom + 8}px`,
                bottom: openUpward ? `${window.innerHeight - rect.top + 8}px` : 'auto',
                zIndex: 99999,
            });
        }
    };

    useEffect(() => {
        if (open) {
            updateDropdownPosition();
            const handleScroll = () => updateDropdownPosition();
            const handleResize = () => updateDropdownPosition();
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleResize);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [open]);

    // Click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                wrapperRef.current && !wrapperRef.current.contains(e.target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(e.target))
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && open) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open]);

    const handleSelect = (option) => {
        onChange(option);
        setOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e) => {
        if (disabled || loading) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!open) setOpen(true);
            else if (highlightedIndex >= 0) handleSelect(options[highlightedIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) setOpen(true);
            setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        }
    };

    // Format display value (capitalize status)
    const formatValue = (val) => {
        if (val === 'active') return 'Active';
        if (val === 'inactive') return 'Inactive';
        return val;
    };

    return (
        <>
            <div
                className={`cs-wrapper ${hasError ? 'has-error' : ''} ${disabled || loading ? 'is-disabled' : ''}`}
                ref={wrapperRef}
            >
                <button
                    type="button"
                    ref={triggerRef}
                    className={`cs-trigger ${open ? 'is-open' : ''}`}
                    onClick={() => !disabled && !loading && setOpen(!open)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || loading}
                >
                    <span className="cs-value">
                        {loading ? 'Loading...' : formatValue(value) || placeholder || 'Select...'}
                    </span>
                    <span className="cs-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </span>
                </button>
            </div>

            {open && createPortal(
                <div
                    className="cs-dropdown"
                    style={dropdownStyle}
                    ref={dropdownRef}
                >
                    <div className="cs-options">
                        {options.map((option, idx) => (
                            <button
                                key={option}
                                type="button"
                                className={`cs-option ${value === option ? 'is-selected' : ''} ${highlightedIndex === idx ? 'is-highlighted' : ''}`}
                                onClick={() => handleSelect(option)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                                <span className="cs-option-text">
                                    {formatValue(option)}
                                </span>
                                {value === option && (
                                    <span className="cs-check">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ============================================
// Main Component
// ============================================
export default function UserFormModal({ show, onClose, onSuccess, editUser = null }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        status: 'active',
    });

    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const isEdit = !!editUser;

    // ============================
    // Load Roles from API
    // ============================
    const loadRoles = async () => {
        setRolesLoading(true);
        try {
            const res = await api.get('/roles?per_page=100');
            if (res.data.status) {
                const roleNames = res.data.data.data.map(r => r.name);
                setRoles(roleNames);
            }
        } catch (err) {
            console.error('Failed to load roles', err);
            setRoles(['Super Admin', 'Admin', 'Manager', 'User']);
        } finally {
            setRolesLoading(false);
        }
    };

    // ============================
    // Modal open/close handler
    // ============================
    useEffect(() => {
        if (show) {
            loadRoles();

            if (editUser) {
                setFormData({
                    name: editUser.name || '',
                    email: editUser.email || '',
                    password: '',
                    password_confirmation: '',
                    role: editUser.roles?.[0] || '',
                    status: editUser.status || 'active',
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    password_confirmation: '',
                    role: '',
                    status: 'active',
                });
            }

            setErrors({});
            setServerError('');
            setShowPassword(false);

            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        };
    }, [show, editUser]);

    // ============================
    // Default role for create mode
    // ============================
    useEffect(() => {
        if (!isEdit && roles.length > 0 && !formData.role) {
            const defaultRole = roles.includes('User') ? 'User' : roles[0];
            setFormData(prev => ({ ...prev, role: defaultRole }));
        }
    }, [roles, isEdit]);

    // ============================
    // Escape key to close modal
    // ============================
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && show && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [show, loading, onClose]);

    // ============================
    // Handlers
    // ============================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (serverError) setServerError('');
    };

    const handleRoleChange = (value) => {
        setFormData(prev => ({ ...prev, role: value }));
        if (errors.role) {
            setErrors(prev => ({ ...prev, role: null }));
        }
        if (serverError) setServerError('');
    };

    const handleStatusChange = (value) => {
        setFormData(prev => ({ ...prev, status: value }));
    };

    // ============================
    // Submit
    // ============================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setServerError('');

        try {
            let res;

            if (isEdit) {
                const payload = { ...formData };
                if (!payload.password) {
                    delete payload.password;
                    delete payload.password_confirmation;
                }
                res = await api.put(`/users/${editUser.id}`, payload);
            } else {
                res = await api.post('/users', formData);
            }

            if (res.data.status) {
                onSuccess(res.data.message || 'Success');
                onClose();
            } else {
                setServerError(res.data.message || 'Operation failed');
            }
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
                setServerError(err.response.data.message || 'Validation failed');
            } else if (err.response?.status === 403) {
                setServerError(err.response.data.message || 'Permission denied');
            } else {
                setServerError(err.response?.data?.message || 'Something went wrong');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="um-backdrop"
                onClick={!loading ? onClose : undefined}
            ></div>

            {/* Wrapper */}
            <div className="um-wrapper">
                <div className="um-box" onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="um-header">
                        <div className="um-header-left">
                                <div className={`um-header-icon ${isEdit ? 'edit' : 'create'}`}>
                                    {isEdit ? '📝' : '➕'}
                                </div>
                            <div>
                                <h5 className="um-title">
                                    {isEdit ? 'Edit User' : 'Create New User'}
                                </h5>
                                <p className="um-subtitle">
                                    {isEdit ? 'Update user information' : 'Fill in the details below'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="um-close"
                            onClick={onClose}
                            disabled={loading}
                            aria-label="Close"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="um-body">

                            {serverError && (
                                <div className="um-alert">
                                    <span className="um-alert-icon">⚠️</span>
                                    <span>{serverError}</span>
                                </div>
                            )}

                            {/* Name */}
                            <div className="um-group">
                                <label className="um-label">
                                    Full Name <span className="um-required">*</span>
                                </label>
                                <div className={`um-input-wrapper ${errors.name ? 'has-error' : ''}`}>
                                    <input
                                        type="text"
                                        name="name"
                                        className="um-input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Enter full name"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <div className="um-error">{errors.name[0]}</div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="um-group">
                                <label className="um-label">
                                    Email Address <span className="um-required">*</span>
                                </label>
                                <div className={`um-input-wrapper ${errors.email ? 'has-error' : ''}`}>
                                    <input
                                        type="email"
                                        name="email"
                                        className="um-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="user@example.com"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <div className="um-error">{errors.email[0]}</div>
                                )}
                            </div>

                            {/* Password */}
                            <div className="um-group">
                                <label className="um-label">
                                    Password {!isEdit && <span className="um-required">*</span>}
                                    {isEdit && <span className="um-hint">(leave blank to keep current)</span>}
                                </label>
                                <div className={`um-input-wrapper ${errors.password ? 'has-error' : ''}`}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        className="um-input um-input-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder={isEdit ? "Leave blank to keep current" : "Minimum 6 characters"}
                                        disabled={loading}
                                        required={!isEdit}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="um-eye"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <div className="um-error">{errors.password[0]}</div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="um-group">
                                <label className="um-label">
                                    Confirm Password {!isEdit && <span className="um-required">*</span>}
                                </label>
                                <div className="um-input-wrapper">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        className="um-input"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        placeholder="Retype password"
                                        disabled={loading}
                                        required={!isEdit}
                                    />
                                </div>
                            </div>

                            {/* Role — Custom Dropdown */}
                            <div className="um-group">
                                <label className="um-label">
                                    Role <span className="um-required">*</span>
                                </label>
                                <CustomSelect
                                    value={formData.role}
                                    options={roles}
                                    onChange={handleRoleChange}
                                    placeholder="Select Role"
                                    disabled={loading}
                                    loading={rolesLoading}
                                    hasError={!!errors.role}
                                />
                                {errors.role && (
                                    <div className="um-error">{errors.role[0]}</div>
                                )}
                            </div>

                            {/* Status — Custom Dropdown */}
                            <div className="um-group" style={{ marginBottom: 0 }}>
                                <label className="um-label">Account Status</label>
                                <CustomSelect
                                    value={formData.status}
                                    options={['active', 'inactive']}
                                    onChange={handleStatusChange}
                                    placeholder="Select Status"
                                    disabled={loading}
                                />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="um-footer">
                            <button
                                type="button"
                                className="um-btn um-btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="um-btn um-btn-primary"
                                disabled={loading || rolesLoading || !formData.role}
                            >
                                {loading ? (
                                    <>
                                        <span className="um-btn-spinner"></span>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        {isEdit ? 'Update User' : 'Create User'}
                                        <span className="um-btn-arrow">→</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </>,
        document.body
    );
}