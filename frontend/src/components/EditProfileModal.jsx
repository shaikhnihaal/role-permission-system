import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';

export default function EditProfileModal({ show, onClose, onSuccess, user }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    // ============================
    // Modal open/close handler
    // ============================
    useEffect(() => {
        if (show && user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
            });
            setErrors({});
            setServerError('');

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
    }, [show, user]);

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
            const res = await api.put('/my-profile', formData);

            if (res.data.status) {
                onSuccess(res.data.message || 'Profile updated');
                onClose();
            } else {
                setServerError(res.data.message || 'Update failed');
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
                                📝
                            </div>
                            <div>
                                <h5 className="um-title">Edit Profile</h5>
                                <p className="um-subtitle">Update your personal information</p>
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
                                        placeholder="Enter your name"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <div className="um-error">{errors.name[0]}</div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="um-group" style={{ marginBottom: 0 }}>
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
                                        placeholder="your@email.com"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                {errors.email && (
                                    <div className="um-error">{errors.email[0]}</div>
                                )}
                                <small style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontWeight: 500 }}>
                                    <span>⚠️</span> After changing email, you will need to login with the new email.
                                </small>
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
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Changes
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