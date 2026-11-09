import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Profile from './pages/Profile';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
        <AuthProvider>
            <ToastProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />

                    <Route path="/users" element={
                        <ProtectedRoute><Users /></ProtectedRoute>
                    } />

                    <Route path="/roles" element={
                        <ProtectedRoute><Roles /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><Profile /></ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
        </ThemeProvider>
    );
}

export default App;