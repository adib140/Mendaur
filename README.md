# Mendaur API

Backend API untuk aplikasi Mendaur - Sistem Pengelolaan Bank Sampah.

## Tech Stack

- PHP 8.2+
- Laravel 11
- MySQL 8.0+
- Laravel Sanctum (Authentication)

## Quick Start

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed

# Start server
php artisan serve
```

## API Documentation

Base URL: `http://localhost:8000/api`

### Authentication
- `POST /api/login` - Login
- `POST /api/register` - Register
- `POST /api/logout` - Logout
- `POST /api/forgot-password/send-otp` - Send OTP
- `POST /api/forgot-password/verify-otp` - Verify OTP
- `POST /api/forgot-password/reset` - Reset Password

### User Endpoints
- `GET /api/users/{id}` - Get user profile
- `PUT /api/users/{id}` - Update profile
- `GET /api/users/{id}/badges` - Get user badges

### Dashboard
- `GET /api/dashboard/leaderboard` - Get leaderboard
- `GET /api/dashboard/stats/{userId}` - Get user stats

### Badge System
- `GET /api/badges` - List all badges
- `GET /api/badges/leaderboard` - Badge leaderboard

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mendaur.id | password123 |
| Superadmin | superadmin@mendaur.id | password123 |
| Demo | demo@mendaur.id | demo123 |

## License

Proprietary - Mendaur Team
