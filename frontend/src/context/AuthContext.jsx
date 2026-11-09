import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

// ✅ Helper: JWT token expire hua hai ya nahi check karo
const isTokenExpired = (token) => {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp is in seconds, Date.now() is in ms
        const isExpired = payload.exp * 1000 < Date.now();
        return isExpired;
    } catch (error) {
        return true; // Invalid token
    }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        const rolesData = localStorage.getItem('roles');
        const permsData = localStorage.getItem('permissions');

        // ✅ Check karo ki token valid hai aur expire nahi hua hai
        if (token && userData && !isTokenExpired(token)) {
            setUser(JSON.parse(userData));
            setRoles(JSON.parse(rolesData || '[]'));
            setPermissions(JSON.parse(permsData || '[]'));
        } else {
            // ❌ Token expired ya invalid hai — clear storage
            if (token) {
                localStorage.clear();
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/login', { email, password });

        if (data.status) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('roles', JSON.stringify(data.roles));
            localStorage.setItem('permissions', JSON.stringify(data.permissions));

            setUser(data.user);
            setRoles(data.roles);
            setPermissions(data.permissions);
        }

        return data;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {}
        localStorage.clear();
        setUser(null);
        setRoles([]);
        setPermissions([]);
    };

    const hasRole = (role) => roles.includes(role);
    const hasAnyRole = (roleArray) => roleArray.some(r => roles.includes(r));
    const hasPermission = (perm) => permissions.includes(perm);
    const hasAnyPermission = (permArray) => permArray.some(p => permissions.includes(p));

    const value = {
        user, roles, permissions, loading,
        isAuthenticated: !!user,
        login, logout,
        hasRole, hasAnyRole, hasPermission, hasAnyPermission,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}