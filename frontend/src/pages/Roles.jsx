import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import RoleFormModal from '../components/RoleFormModal';

export default function Roles() {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editRole, setEditRole] = useState(null);
    const { showToast } = useToast();

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/roles?page=${page}&per_page=10&search=${search}`);
            setRoles(res.data.data.data);
            setMeta(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchRoles, 400);
        return () => clearTimeout(timer);
    }, [page, search]);

    const handleDelete = async (id, name) => {
        if (name === 'Super Admin') {
            showToast('Super Admin role cannot be deleted', 'error');
            return;
        }
        if (!window.confirm(`Delete role "${name}"?`)) return;
        try {
            const res = await api.delete(`/roles/${id}`);
            if (res.data.status) {
                showToast('Role deleted successfully', 'success');
                fetchRoles();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed', 'error');
        }
    };

    const handleCreate = () => {
        setEditRole(null);
        setShowModal(true);
    };

    const handleEdit = (role) => {
        setEditRole(role);
        setShowModal(true);
    };

    const handleSuccess = (message) => {
        showToast(message, 'success');
        fetchRoles();
    };


    return (
        <Layout>

            {/* Single Card — Header + Table */}
            <div className="up-card">

                {/* Header */}
                <div className="up-header">
                    <div className="up-header-left">
                        <div className="up-header-icon">🎭</div>
                        <div>
                            <h2 className="up-title">Role Management</h2>
                            <p className="up-subtitle">
                                {meta?.total ? `${meta.total} total roles` : 'Manage all roles'}
                            </p>
                        </div>
                    </div>

                    <div className="up-header-right">
                        <div className="up-search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>

                        {hasPermission('role-create') && (
                            <button className="up-btn-primary" onClick={handleCreate}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Create Role
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Body */}
                <div className="up-card-body">
                    {loading ? (
                        <div className="up-loading">
                            <div className="up-spinner"></div>
                            <p>Loading roles...</p>
                        </div>
                    ) : roles.length === 0 ? (
                        <div className="up-empty">
                            <div className="up-empty-icon">🔍</div>
                            <h4>No roles found</h4>
                            <p>Try adjusting your search or create a new role.</p>
                        </div>
                    ) : (
                        <>
                            <div className="up-table-wrapper">
                                <table className="up-table">
                                    <thead>
                                        <tr>
                                            <th>Role Name</th>
                                            <th>Permissions</th>
                                            <th>Users</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {roles.map(r => {
                                            const isSuperAdmin = r.name === 'Super Admin';
                                            return (
                                                <tr key={r.id}>
                                                    {/* Role Name + Avatar */}
                                                    <td data-label="Role">
                                                        <div className="up-user-cell">
                                                            <div className="up-avatar">
                                                                {r.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="up-user-info">
                                                                <div className="up-user-name">
                                                                    {r.name}
                                                                    {isSuperAdmin && (
                                                                        <span className="up-role-badge ms-2" style={{ fontSize: '10px' }}>
                                                                            🔒 Protected
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="up-user-id">ID: #{r.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Permissions */}
                                                    <td data-label="Permissions">
                                                        <div className="up-roles">
                                                            <span className="up-role-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                                                                {r.permissions_count} total
                                                            </span>
                                                            {r.permissions.slice(0, 2).map(p => (
                                                                <span key={p} className="up-role-badge">
                                                                    {p}
                                                                </span>
                                                            ))}
                                                            {r.permissions.length > 2 && (
                                                                <span className="up-role-badge" style={{ backgroundColor: 'transparent', border: '1px solid rgba(226, 232, 240, 0.8)', color: '#64748b' }}>
                                                                    +{r.permissions.length - 2} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Users Count */}
                                                    <td data-label="Users">
                                                        <span className="up-status" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '6px 12px' }}>
                                                            👤 {r.users_count} users
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td data-label="Actions">
                                                        <div className="up-actions">
                                                            {hasPermission('role-edit') && (
                                                                <button
                                                                    className="up-btn-icon up-btn-edit"
                                                                    onClick={() => handleEdit(r)}
                                                                    disabled={isSuperAdmin}
                                                                    title={isSuperAdmin ? 'Super Admin cannot be edited' : 'Edit role'}
                                                                    style={{ opacity: isSuperAdmin ? 0.4 : 1, cursor: isSuperAdmin ? 'not-allowed' : 'pointer' }}
                                                                >
                                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {hasPermission('role-delete') && (
                                                                <button
                                                                    className="up-btn-icon up-btn-delete"
                                                                    onClick={() => handleDelete(r.id, r.name)}
                                                                    disabled={isSuperAdmin}
                                                                    title={isSuperAdmin ? 'Super Admin cannot be deleted' : 'Delete role'}
                                                                    style={{ opacity: isSuperAdmin ? 0.4 : 1, cursor: isSuperAdmin ? 'not-allowed' : 'pointer' }}
                                                                >
                                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {meta && meta.total > 0 && (
                                <div className="up-pagination">
                                    <div className="up-pagination-info">
                                        Showing <strong>{meta.from || 0}</strong> to <strong>{meta.to || 0}</strong> of <strong>{meta.total}</strong>
                                    </div>
                                    <nav className="up-pagination-nav">
                                        <button
                                            className="up-page-btn"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            ← Prev
                                        </button>
                                        {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                                            <button
                                                key={p}
                                                className={`up-page-btn ${p === meta.current_page ? 'active' : ''}`}
                                                onClick={() => setPage(p)}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                        <button
                                            className="up-page-btn"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === meta.last_page}
                                        >
                                            Next →
                                        </button>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal */}
            <RoleFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                editRole={editRole}
            />
        </Layout>
    );
}