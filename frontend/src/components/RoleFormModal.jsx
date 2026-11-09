import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/axios';

export default function RoleFormModal({ show, onClose, onSuccess, editRole = null }) {
    const [formData, setFormData] = useState({
        name: '',
        permissions: [],
    });

    const [allPermissions, setAllPermissions] = useState([]);
    const [groupedPermissions, setGroupedPermissions] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const isEdit = !!editRole;
    const isSuperAdmin = editRole?.name === 'Super Admin';

    // ============================
    // Load Permissions from API
    // ============================
    const loadPermissions = async () => {
        try {
            const res = await api.get('/permissions');
            if (res.data.status) {
                setAllPermissions(res.data.data.all);
                setGroupedPermissions(res.data.data.grouped);
            }
        } catch (err) {
            console.error('Failed to load permissions', err);
        }
    };

    // ============================
    // Modal open/close handler
    // ============================
    useEffect(() => {
        if (show) {
            loadPermissions();

            if (editRole) {
                setFormData({
                    name: editRole.name || '',
                    permissions: editRole.permissions || [],
                });
            } else {
                setFormData({
                    name: '',
                    permissions: [],
                });
            }

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
    }, [show, editRole]);

    // ============================
    // Escape key to close
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

    const handlePermissionToggle = (permName) => {
        setFormData(prev => {
            const has = prev.permissions.includes(permName);
            return {
                ...prev,
                permissions: has
                    ? prev.permissions.filter(p => p !== permName)
                    : [...prev.permissions, permName],
            };
        });
    };

    const handleSelectGroup = (moduleName) => {
        const groupPerms = groupedPermissions[moduleName]?.map(p => p.name) || [];
        const allSelected = groupPerms.every(p => formData.permissions.includes(p));

        setFormData(prev => {
            if (allSelected) {
                return {
                    ...prev,
                    permissions: prev.permissions.filter(p => !groupPerms.includes(p)),
                };
            } else {
                const merged = new Set([...prev.permissions, ...groupPerms]);
                return { ...prev, permissions: Array.from(merged) };
            }
        });
    };

    const handleSelectAll = () => {
        const allSelected = allPermissions.every(p => formData.permissions.includes(p));
        setFormData(prev => ({
            ...prev,
            permissions: allSelected ? [] : allPermissions,
        }));
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
                res = await api.put(`/roles/${editRole.id}`, formData);
            } else {
                res = await api.post('/roles', formData);
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

    const allSelected = allPermissions.length > 0 && allPermissions.every(p => formData.permissions.includes(p));

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
                            <div className={`um-header-icon ${isEdit ? 'edit' : 'create'}`}>
                                {isEdit ? '📝' : '➕'}
                            </div>
                            <div>
                                <h5 className="um-title">
                                    {isEdit ? 'Edit Role' : 'Create New Role'}
                                </h5>
                                <p className="um-subtitle">
                                    {isEdit ? 'Update role and permissions' : 'Fill in the details below'}
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

                            {isSuperAdmin && (
                                <div className="um-alert" style={{ background: 'rgba(254, 243, 199, 0.9)', borderColor: '#fbbf24', color: '#92400e' }}>
                                    <span className="um-alert-icon">🔒</span>
                                    <span>Super Admin role cannot be modified.</span>
                                </div>
                            )}

                            {/* Role Name */}
                            <div className="um-group">
                                <label className="um-label">
                                    Role Name <span className="um-required">*</span>
                                </label>
                                <div className={`um-input-wrapper ${errors.name ? 'has-error' : ''}`}>
                                    <input
                                        type="text"
                                        name="name"
                                        className="um-input"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. Editor, Moderator"
                                        disabled={loading || isSuperAdmin}
                                        required
                                    />
                                </div>
                                {errors.name && (
                                    <div className="um-error">{errors.name[0]}</div>
                                )}
                            </div>

                            {/* Permissions Section */}
                            <div className="um-group" style={{ marginBottom: 0 }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="um-label mb-0">
                                        Permissions
                                        <span className="um-hint">
                                            ({formData.permissions.length} selected)
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={handleSelectAll}
                                        disabled={loading || isSuperAdmin}
                                        style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '8px' }}
                                    >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>

                                {Object.keys(groupedPermissions).length === 0 ? (
                                    <div className="text-muted small py-4 text-center">
                                        <div className="um-mini-spinner" style={{ marginRight: 8 }}></div>
                                        Loading permissions...
                                    </div>
                                ) : (
                                    <div className="permissions-container-modern">
                                        {Object.entries(groupedPermissions).map(([module, perms]) => {
                                            const modulePermNames = perms.map(p => p.name);
                                            const allModuleSelected = modulePermNames.every(p => formData.permissions.includes(p));
                                            const someSelected = modulePermNames.some(p => formData.permissions.includes(p));

                                            return (
                                                <div key={module} className="perm-group-modern">
                                                    <div className="perm-group-header-modern">
                                                        <label className="perm-group-label-modern">
                                                            <input
                                                                type="checkbox"
                                                                checked={allModuleSelected}
                                                                ref={el => {
                                                                    if (el) el.indeterminate = someSelected && !allModuleSelected;
                                                                }}
                                                                onChange={() => handleSelectGroup(module)}
                                                                disabled={loading || isSuperAdmin}
                                                                className="perm-checkbox-modern"
                                                            />
                                                            <strong className="text-capitalize">{module}</strong>
                                                            <span className="perm-count-badge">
                                                                {modulePermNames.filter(p => formData.permissions.includes(p)).length}/{perms.length}
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div className="perm-items-modern">
                                                        {perms.map(perm => (
                                                            <label key={perm.id} className="perm-item-modern">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.permissions.includes(perm.name)}
                                                                    onChange={() => handlePermissionToggle(perm.name)}
                                                                    disabled={loading || isSuperAdmin}
                                                                    className="perm-checkbox-modern"
                                                                />
                                                                <span className="perm-name-modern">{perm.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                disabled={loading || isSuperAdmin}
                            >
                                {loading ? (
                                    <>
                                        <span className="um-btn-spinner"></span>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        {isEdit ? 'Update Role' : 'Create Role'}
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