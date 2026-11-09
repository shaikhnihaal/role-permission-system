import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';

export default function ChangePasswordModal({ show, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    // ============================
    // Modal open/close handler
    // ============================
    useEffect(() => {
        if (show) {
            setFormData({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
            setErrors({});
            setServerError('');
            setShowPasswords(false);

            // Body lock + navbar hide
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
    }, [show]);

    // ============================
    // Escape key to close
    // ============================
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && show && !loading) onClose();
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
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (serverError) setServerError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        setServerError('');

        try {
            const res = await api.post('/my-profile/change-password', formData);

            if (res.data.status) {
                onSuccess(res.data.message || 'Password changed');
                onClose();
            } else {
                setServerError(res.data.message || 'Failed');
            }
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
                setServerError(err.response.data.message || 'Validation failed');
            } else {
                setServerError(err.response?.data?.message || 'Something went wrong');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    // ✅ React Portal
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
                            <div className="um-header-icon edit">
                                🔐
                            </div>
                            <div>
                                <h5 className="um-title">Change Password</h5>
                                <p className="um-subtitle">Secure your account with a new password</p>
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

                            {/* Show/Hide Toggle */}
                            <div className="d-flex justify-content-end mb-3">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    style={{ fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    {showPasswords ? (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                            Show
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Current Password */}
                            <div className="um-group">
                                <label className="um-label">
                                    Current Password <span className="um-required">*</span>
                                </label>
                                <div className={`um-input-wrapper ${errors.current_password ? 'has-error' : ''}`}>
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        name="current_password"
                                        className="um-input um-input-password"
                                        value={formData.current_password}
                                        onChange={handleChange}
                                        placeholder="Enter current password"
                                        disabled={loading}
                                        required
                                    />
                                    {/* Optional: Eye icon here if you want per-field toggle */}
                                </div>
                                {errors.current_password && (
                                    <div className="um-error">{errors.current_password[0]}</div>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="um-group">
                                <label className="um-label">
                                    New Password <span className="um-required">*</span>
                                </label>
                                <div className={`um-input-wrapper ${errors.password ? 'has-error' : ''}`}>
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        name="password"
                                        className="um-input um-input-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 characters"
                                        disabled={loading}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                {errors.password && (
                                    <div className="um-error">{errors.password[0]}</div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="um-group" style={{ marginBottom: 0 }}>
                                <label className="um-label">
                                    Confirm New Password <span className="um-required">*</span>
                                </label>
                                <div className="um-input-wrapper">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        name="password_confirmation"
                                        className="um-input"
                                        value={formData.password_confirmation}
                                        onChange={handleChange}
                                        placeholder="Retype new password"
                                        disabled={loading}
                                        required
                                    />
                                </div>
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="um-btn-spinner"></span>
                                        Changing...
                                    </>
                                ) : (
                                    <>
                                        Update Password
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