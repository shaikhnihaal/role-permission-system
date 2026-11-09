# 🛡️ Role & Permission Management System

A full-stack **Role-Based Access Control (RBAC)** system with modern UI, JWT authentication, and a premium dashboard.

## 🚀 Features
- 🔐 **JWT Authentication** (Login, Register, Logout, Auto-logout on expiry)
- 🎭 **Role & Permission (RBAC)** — Super Admin, Admin, Manager, User
- 👥 **User Management** — Full CRUD with permissions
- 🔑 **Role Management** — Create roles, assign/revoke permissions
- 👤 **Profile Management** — Edit profile, change password
- 📊 **Dashboard Analytics** — Line chart (User Growth) & Doughnut chart (Role Distribution)
- 🌙 **Dark / Light Mode** — Theme toggle with persistence
- 📧 **Forgot / Reset Password** — Email-based reset link
- 🛡️ **Rate Limiting** — Brute-force protection on login
- 📱 **Fully Responsive** — Mobile, Tablet, Desktop

## 🛠️ Tech Stack

| Backend | Frontend |
|---------|----------|
| Laravel 12 | React 19 (Vite) |
| MySQL | React Router v7 |
| JWT Auth (tymon/jwt-auth) | Axios |
| Spatie Permission | Chart.js (react-chartjs-2) |
| REST API | Context API + Custom Hooks |

## 📦 Installation

### Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret
php artisan migrate --seed
php artisan serve