import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import UserFormModal from '../components/UserFormModal';

export default function Users() {
    const { hasPermission } = useAuth();
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const { showToast } = useToast();
    

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/users?page=${page}&per_page=10&search=${search}`);
            setUsers(res.data.data.data);
            setMeta(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 400);
        return () => clearTimeout(timer);
    }, [page, search]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this user?')) return;
        try {
            const res = await api.delete(`/users/${id}`);
            if (res.data.status) {
                showToast('User deleted successfully', 'success');
                fetchUsers();
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed', 'error');
        }
    };

    const handleCreate = () => {
        setEditUser(null);
        setShowModal(true);
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setShowModal(true);
    };

    const handleSuccess = (message) => {
        showToast(message, 'success');
        fetchUsers();
    };



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
        <Layout>

            {/* Single Card — Header + Table */}
            <div className="up-card">

                {/* Header */}
                <div className="up-header">
                    <div className="up-header-left">
                        <div className="up-header-icon">👥</div>
                        <div>
                            <h2 className="up-title">Users Management</h2>
                            <p className="up-subtitle">
                                {meta?.total ? `${meta.total} total users` : 'Manage all users'}
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
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            />
                        </div>

                        {hasPermission('user-create') && (
                            <button className="up-btn-primary" onClick={handleCreate}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Create User
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Body */}
                <div className="up-card-body">
                    {loading ? (
                        <div className="up-loading">
                            <div className="up-spinner"></div>
                            <p>Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="up-empty">
                            <div className="up-empty-icon">🔍</div>
                            <h4>No users found</h4>
                            <p>Try adjusting your search or create a new user.</p>
                        </div>
                    ) : (
                        <>
                            <div className="up-table-wrapper">
                                <table className="up-table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td data-label="User">
                                                <div className="up-user-cell">
                                                    <div className="up-avatar">
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <div className="up-user-info">
                                                        <div className="up-user-name">{u.name}</div>
                                                        <div className="up-user-id">ID: #{u.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td data-label="Email">
                                                <span className="up-email">{u.email}</span>
                                            </td>
                                            <td data-label="Role">
                                                <div className="up-roles">
                                                    {u.roles.map(r => (
                                                        <span key={r} className="up-role-badge">
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td data-label="Status">
                                                <span className={`up-status ${u.status === 'active' ? 'up-status-active' : 'up-status-inactive'}`}>
                                                    <span className="up-status-dot"></span>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td data-label="Actions">
                                                <div className="up-actions">
                                                    {hasPermission('user-edit') && (
                                                        <button
                                                            className="up-btn-icon up-btn-edit"
                                                            onClick={() => handleEdit(u)}
                                                            title="Edit user"
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {hasPermission('user-delete') && (
                                                        <button
                                                            className="up-btn-icon up-btn-delete"
                                                            onClick={() => handleDelete(u.id)}
                                                            title="Delete user"
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
                                    ))}
                                </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {meta && meta.last_page > 1 && (
                                <div className="up-pagination">
                                    <div className="up-pagination-info">
                                        Showing <strong>{meta.from}</strong> to <strong>{meta.to}</strong> of <strong>{meta.total}</strong>
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
            <UserFormModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                editUser={editUser}
            />
        </Layout>
    );
}