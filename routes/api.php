<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\TabungSampahController;
use App\Http\Controllers\JadwalPenyetoranController;
use App\Http\Controllers\JenisSampahController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\ArtikelController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\BadgeController;
use App\Http\Controllers\Api\BadgeProgressController;
use App\Http\Controllers\PenarikanTunaiController;
use App\Http\Controllers\Admin\AdminPenarikanTunaiController;
use App\Http\Controllers\PenukaranProdukController;
use App\Http\Controllers\KategoriSampahController;
use App\Http\Controllers\PointController;
use App\Http\Controllers\AdminPointController;
use App\Http\Controllers\DashboardAdminController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminAnalyticsController;
use App\Http\Controllers\Admin\AdminLeaderboardController;
use App\Http\Controllers\Admin\AdminPointsController;
use App\Http\Controllers\Admin\AdminReportsController;
use App\Http\Controllers\Admin\AdminWasteController;
use App\Http\Controllers\Admin\AdminPenukaranProdukController;
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\RoleManagementController;
use App\Http\Controllers\Admin\PermissionAssignmentController;
use App\Http\Controllers\Admin\BadgeManagementController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\SystemSettingsController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Admin\ActivityLogController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Health Check - No auth, no database required
Route::get('health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'service' => 'Mendaur Bank Sampah API',
        'version' => '1.0.2' // Updated for image upload fix
    ]);
});

// Debug endpoint - System status check
Route::get('debug', function () {
    $dbStatus = 'unknown';
    try {
        \DB::connection()->getPdo();
        $dbStatus = 'connected';
    } catch (\Exception $e) {
        $dbStatus = 'error: ' . $e->getMessage();
    }

    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'service' => 'Mendaur Bank Sampah API',
        'version' => '1.0.2',
        'environment' => app()->environment(),
        'database' => $dbStatus,
        'php_version' => PHP_VERSION,
        'laravel_version' => app()->version(),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
    ]);
});

// Safari/iOS Diagnostic Endpoint
Route::get('debug/safari-ios', function (\Illuminate\Http\Request $request) {
    $userAgent = $request->header('User-Agent', '');

    // Detect browser/device
    $isSafari = str_contains($userAgent, 'Safari')
        && !str_contains($userAgent, 'Chrome')
        && !str_contains($userAgent, 'Chromium')
        && !str_contains($userAgent, 'Edg');
    $isIOS = str_contains($userAgent, 'iPhone')
        || str_contains($userAgent, 'iPad')
        || str_contains($userAgent, 'iPod');
    $isChrome = str_contains($userAgent, 'Chrome') && !str_contains($userAgent, 'Edg');
    $isFirefox = str_contains($userAgent, 'Firefox');
    $isEdge = str_contains($userAgent, 'Edg');

    return response()->json([
        'status' => 'ok',
        'message' => 'Safari/iOS diagnostic endpoint',
        'timestamp' => now()->toIso8601String(),
        'client_info' => [
            'user_agent' => $userAgent,
            'is_safari' => $isSafari,
            'is_ios' => $isIOS,
            'is_chrome' => $isChrome,
            'is_firefox' => $isFirefox,
            'is_edge' => $isEdge,
            'ip' => $request->ip(),
        ],
        'request_headers' => [
            'origin' => $request->header('Origin'),
            'referer' => $request->header('Referer'),
            'accept' => $request->header('Accept'),
            'content_type' => $request->header('Content-Type'),
        ],
        'server_config' => [
            'cors_supports_credentials' => config('cors.supports_credentials'),
            'session_driver' => config('session.driver'),
            'session_same_site' => config('session.same_site'),
            'session_secure' => config('session.secure'),
            'sanctum_stateful_domains' => config('sanctum.stateful'),
        ],
        'recommendations' => $isSafari || $isIOS ? [
            'Pastikan frontend menggunakan credentials: include',
            'Pastikan SESSION_SAME_SITE=none untuk cross-site (production)',
            'Pastikan SESSION_SECURE_COOKIE=true untuk HTTPS (production)',
            'Cek apakah "Prevent Cross-Site Tracking" dimatikan di Safari Settings',
        ] : [],
    ]);
});

// Cloudinary Config Check (for debugging - should be removed in production)
Route::get('debug/cloudinary-config', function () {
    $cloudName = config('services.cloudinary.cloud_name');
    $apiKey = config('services.cloudinary.api_key');
    $apiSecret = config('services.cloudinary.api_secret');

    return response()->json([
        'status' => 'ok',
        'cloudinary_configured' => !empty($cloudName) && !empty($apiKey) && !empty($apiSecret),
        'cloud_name' => $cloudName ? substr($cloudName, 0, 3) . '***' : 'NOT SET',
        'api_key_set' => !empty($apiKey),
        'api_secret_set' => !empty($apiSecret),
        'upload_folder' => config('services.cloudinary.upload_folder', 'mendaur'),
    ]);
});

// Auth Routes
Route::post('login', [AuthController::class, 'login'])->name('login');
Route::post('register', [AuthController::class, 'register']);

// Forgot Password Routes (Public) - Rate limiting temporarily disabled for testing
Route::post('forgot-password', [ForgotPasswordController::class, 'sendOTP']);
Route::post('verify-otp', [ForgotPasswordController::class, 'verifyOTP']);
Route::post('reset-password', [ForgotPasswordController::class, 'resetPassword']);
Route::post('resend-otp', [ForgotPasswordController::class, 'resendOTP']);

// Debug endpoint for OTP testing (REMOVE IN PRODUCTION)
Route::get('debug/otp/{email}', function ($email) {
    $record = \App\Models\PasswordReset::where('email', $email)
        ->orderBy('created_at', 'desc')
        ->first();

    if (!$record) {
        return response()->json([
            'found' => false,
            'message' => 'No OTP record found for this email'
        ]);
    }

    return response()->json([
        'found' => true,
        'email' => $record->email,
        'otp' => $record->otp,
        'expires_at' => $record->expires_at,
        'is_expired' => \Carbon\Carbon::now()->gt($record->expires_at),
        'verified_at' => $record->verified_at,
        'created_at' => $record->created_at,
    ]);
});

// Jadwal Penyetoran (Public - for form)
Route::get('jadwal-penyetoran', [JadwalPenyetoranController::class, 'index']);
Route::get('jadwal-penyetoran/{id}', [JadwalPenyetoranController::class, 'show']);
Route::get('jadwal-penyetoran-aktif', [JadwalPenyetoranController::class, 'aktif']);

// Jenis Sampah (Public - for form dropdown)
Route::get('jenis-sampah', [JenisSampahController::class, 'index']);
Route::get('jenis-sampah/stats', [JenisSampahController::class, 'stats']);
Route::get('jenis-sampah/{id}', [JenisSampahController::class, 'show']);

// Hierarchical Kategori Sampah System
Route::get('kategori-sampah', [KategoriSampahController::class, 'index']);
Route::get('kategori-sampah/{id}', [KategoriSampahController::class, 'show']);
Route::get('kategori-sampah/{id}/jenis', [KategoriSampahController::class, 'getJenisByKategori']);
Route::get('jenis-sampah-all', [KategoriSampahController::class, 'getAllJenisSampah']);

// Produk (Public - for browsing)
Route::get('produk', [ProdukController::class, 'index']);
Route::get('produk/{id}', [ProdukController::class, 'show']);

// Artikel (Public - for reading)
Route::get('artikel', [ArtikelController::class, 'index']);
Route::get('artikel/{slug}', [ArtikelController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile', [AuthController::class, 'profile']);
    Route::put('profile', [AuthController::class, 'updateProfile']);
    Route::post('profile/update', [AuthController::class, 'updateProfile']); // Alternative POST endpoint

    // Tabung Sampah
    Route::apiResource('tabung-sampah', TabungSampahController::class);
    Route::get('users/{id}/tabung-sampah', [TabungSampahController::class, 'byUser']);

    // Transaksi
    Route::post('jadwal-penyetoran', [JadwalPenyetoranController::class, 'store']);
    Route::put('jadwal-penyetoran/{id}', [JadwalPenyetoranController::class, 'update']);
    Route::delete('jadwal-penyetoran/{id}', [JadwalPenyetoranController::class, 'destroy']);

    // Kategori & Jenis Sampah Management (Admin/Superadmin Only)
    Route::middleware('role:superadmin')->group(function () {
        Route::post('kategori-sampah', [KategoriSampahController::class, 'store']);
        Route::put('kategori-sampah/{id}', [KategoriSampahController::class, 'update']);
        Route::delete('kategori-sampah/{id}', [KategoriSampahController::class, 'destroy']);

        Route::post('jenis-sampah', [JenisSampahController::class, 'store']);
        Route::put('jenis-sampah/{id}', [JenisSampahController::class, 'update']);
        Route::delete('jenis-sampah/{id}', [JenisSampahController::class, 'destroy']);

        // Product Management (Superadmin Only)
        Route::post('produk', [ProdukController::class, 'store']);
        Route::put('produk/{id}', [ProdukController::class, 'update']);
        Route::delete('produk/{id}', [ProdukController::class, 'destroy']);

        // Article Management (Superadmin Only)
        Route::post('artikel', [ArtikelController::class, 'store']);
        Route::put('artikel/{id}', [ArtikelController::class, 'update']);
        Route::delete('artikel/{id}', [ArtikelController::class, 'destroy']);
    });

    // Cash Withdrawal Routes (User)
    Route::get('penarikan-tunai', [PenarikanTunaiController::class, 'index']);
    Route::post('penarikan-tunai', [PenarikanTunaiController::class, 'store']);
    Route::get('penarikan-tunai/summary', [PenarikanTunaiController::class, 'summary']);
    Route::get('penarikan-tunai/user/{userId}', [PenarikanTunaiController::class, 'byUser']);
    Route::get('penarikan-tunai/{id}', [PenarikanTunaiController::class, 'show']);

    // Product Redemption Routes (User)
    Route::get('penukaran-produk', [PenukaranProdukController::class, 'index']);
    Route::post('penukaran-produk', [PenukaranProdukController::class, 'store']);
    Route::get('penukaran-produk/user/{userId}', [PenukaranProdukController::class, 'byUser']);
    Route::get('penukaran-produk/{id}', [PenukaranProdukController::class, 'show']);
    Route::put('penukaran-produk/{id}/cancel', [PenukaranProdukController::class, 'cancel']);
    Route::delete('penukaran-produk/{id}', [PenukaranProdukController::class, 'destroy']);

    // Setor Sampah user endpoint alias
    Route::get('setor-sampah/user/{userId}', [TabungSampahController::class, 'byUser']);

    // Legacy endpoint (backward compatibility)
    Route::get('tukar-produk', [PenukaranProdukController::class, 'index']);
    Route::get('tukar-produk/{id}', [PenukaranProdukController::class, 'show']);

    // Badge Progress Tracking Routes
    Route::get('user/badges/progress', [BadgeProgressController::class, 'getUserProgress']);
    Route::get('user/badges/completed', [BadgeProgressController::class, 'getCompletedBadges']);
    Route::get('badges/leaderboard', [BadgeProgressController::class, 'getLeaderboard']);
    Route::get('badges/available', [BadgeProgressController::class, 'getAvailableBadges']);

    // Point System Routes (User)
    Route::get('poin/history', [PointController::class, 'getHistory']);
    Route::get('poin/breakdown/{userId}', [PointController::class, 'getBreakdown']);
    Route::post('poin/bonus', [PointController::class, 'awardBonus']);

    // Notification Routes (User)
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread', [NotificationController::class, 'unread']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::get('notifications/{id}', [NotificationController::class, 'show']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
    Route::post('notifications/create', [NotificationController::class, 'store']);

    // Admin Badge Analytics Routes
    Route::middleware('admin')->get('admin/badges/analytics', [BadgeProgressController::class, 'getAnalytics']);

    // Admin Point Dashboard Routes
    Route::middleware('auth:sanctum')->prefix('poin/admin')->group(function () {
        Route::get('stats', [AdminPointController::class, 'getStats']);
        Route::get('history', [AdminPointController::class, 'getHistory']);
        Route::get('redemptions', [AdminPointController::class, 'getRedemptions']);
    });

    Route::middleware('auth:sanctum')->get('poin/breakdown/all', [AdminPointController::class, 'getBreakdown']);

    // Admin Dashboard Routes
    Route::middleware('auth:sanctum')->prefix('admin/dashboard')->group(function () {
        Route::get('overview', [DashboardAdminController::class, 'getOverview']);
        Route::get('users', [DashboardAdminController::class, 'getUsers']);
        Route::get('waste-summary', [DashboardAdminController::class, 'getWasteSummary']);
        Route::get('point-summary', [DashboardAdminController::class, 'getPointSummary']);
        Route::get('waste-by-user', [DashboardAdminController::class, 'getWasteByUser']);
        Route::get('report', [DashboardAdminController::class, 'getReport']);
    });

    // Comprehensive Admin Endpoints
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        // Dashboard Overview
        Route::get('dashboard/overview', [AdminDashboardController::class, 'overview']);
        Route::get('dashboard/stats', [AdminDashboardController::class, 'stats']);

        // User Management
        Route::get('users', [AdminUserController::class, 'index']);
        Route::post('users', [AdminUserController::class, 'store']);
        Route::get('users/{userId}', [AdminUserController::class, 'show']);
        Route::put('users/{userId}', [AdminUserController::class, 'update']);
        Route::patch('users/{userId}/status', [AdminUserController::class, 'updateStatus']);
        Route::patch('users/{userId}/role', [AdminUserController::class, 'updateRole']);
        Route::patch('users/{userId}/tipe', [AdminUserController::class, 'updateTipe']);
        Route::delete('users/{userId}', [AdminUserController::class, 'destroy']);

        // Waste Deposit Management (NEW - Phase 1 Critical)
        Route::get('penyetoran-sampah', [AdminWasteController::class, 'index']);
        Route::get('penyetoran-sampah/{id}', [AdminWasteController::class, 'show']);
        Route::patch('penyetoran-sampah/{id}/approve', [AdminWasteController::class, 'approve']);
        Route::patch('penyetoran-sampah/{id}/reject', [AdminWasteController::class, 'reject']);
        Route::delete('penyetoran-sampah/{id}', [AdminWasteController::class, 'destroy']);
        Route::get('penyetoran-sampah/stats/overview', [AdminWasteController::class, 'stats']);

        // Product Exchange Management (NEW - Phase 3)
        Route::get('penukar-produk', [AdminPenukaranProdukController::class, 'index']);
        Route::get('penukar-produk/{exchangeId}', [AdminPenukaranProdukController::class, 'show']);
        Route::patch('penukar-produk/{exchangeId}/approve', [AdminPenukaranProdukController::class, 'approve']);
        Route::patch('penukar-produk/{exchangeId}/reject', [AdminPenukaranProdukController::class, 'reject']);
        Route::patch('penukar-produk/{exchangeId}/complete', [AdminPenukaranProdukController::class, 'complete']);
        Route::delete('penukar-produk/{exchangeId}', [AdminPenukaranProdukController::class, 'destroy']);
        Route::get('penukar-produk/stats/overview', [AdminPenukaranProdukController::class, 'stats']);

        // Cash Withdrawal Management (Phase 2 - UPDATED ROUTES)
        Route::get('penarikan-tunai', [AdminPenarikanTunaiController::class, 'index']);
        Route::get('penarikan-tunai/{withdrawalId}', [AdminPenarikanTunaiController::class, 'show']);
        Route::patch('penarikan-tunai/{withdrawalId}/approve', [AdminPenarikanTunaiController::class, 'approve']);
        Route::patch('penarikan-tunai/{withdrawalId}/reject', [AdminPenarikanTunaiController::class, 'reject']);
        Route::delete('penarikan-tunai/{withdrawalId}', [AdminPenarikanTunaiController::class, 'destroy']);
        Route::get('penarikan-tunai/stats/overview', [AdminPenarikanTunaiController::class, 'stats']);

        // Analytics
        Route::get('analytics/waste', [AdminAnalyticsController::class, 'waste']);
        Route::get('analytics/waste-by-user', [AdminAnalyticsController::class, 'wasteByUser']);
        Route::get('analytics/points', [AdminAnalyticsController::class, 'points']);

        // Leaderboard
        Route::get('leaderboard', [AdminLeaderboardController::class, 'index']);
        Route::get('leaderboard/overview', [AdminLeaderboardController::class, 'overview']);
        Route::get('leaderboard/settings', [AdminLeaderboardController::class, 'getSettings']);
        Route::put('leaderboard/settings', [AdminLeaderboardController::class, 'updateSettings']);
        Route::post('leaderboard/reset', [AdminLeaderboardController::class, 'resetLeaderboard']);
        Route::get('leaderboard/history', [AdminLeaderboardController::class, 'getHistory']);

        // Points Management
        Route::post('points/award', [AdminPointsController::class, 'award']);
        Route::get('points/history', [AdminPointsController::class, 'history']);

        // Reports
        Route::get('reports/list', [AdminReportsController::class, 'list']);
        Route::post('reports/generate', [AdminReportsController::class, 'generate']);
        Route::get('export', [AdminReportsController::class, 'export']);

        // Activity Logs Management
        Route::get('users/{userId}/activity-logs', [ActivityLogController::class, 'userActivityLogs']);
        Route::get('activity-logs', [ActivityLogController::class, 'allActivityLogs']);
        Route::get('activity-logs/{logId}', [ActivityLogController::class, 'show']);
        Route::get('activity-logs/stats/overview', [ActivityLogController::class, 'activityStats']);
        Route::get('activity-logs/export/csv', [ActivityLogController::class, 'exportCsv']);

        // Badge Management (Admin access level)
        Route::get('badges', [BadgeManagementController::class, 'index']);
        Route::post('badges', [BadgeManagementController::class, 'store']);
        Route::get('badges/{badgeId}', [BadgeManagementController::class, 'show']);
        Route::put('badges/{badgeId}', [BadgeManagementController::class, 'update']);
        Route::delete('badges/{badgeId}', [BadgeManagementController::class, 'destroy']);
        Route::post('badges/{badgeId}/assign', [BadgeManagementController::class, 'assignToUser']);
        Route::post('badges/{badgeId}/revoke', [BadgeManagementController::class, 'revokeFromUser']);
        Route::get('badges/{badgeId}/users', [BadgeManagementController::class, 'getUsersWithBadge']);

        // Content Management Routes

        // Produk Management (Admin)
        Route::get('produk', [ProdukController::class, 'index']);
        Route::get('produk/{id}', [ProdukController::class, 'show']);
        Route::post('produk', [ProdukController::class, 'store']);
        Route::put('produk/{id}', [ProdukController::class, 'update']);
        Route::delete('produk/{id}', [ProdukController::class, 'destroy']);

        // Artikel Management (Admin)
        Route::get('artikel', [ArtikelController::class, 'index']);
        Route::get('artikel/{slug}', [ArtikelController::class, 'show']);
        Route::post('artikel', [ArtikelController::class, 'store']);
        Route::put('artikel/{slug}', [ArtikelController::class, 'update']);
        Route::delete('artikel/{slug}', [ArtikelController::class, 'destroy']);

        // Jadwal Penyetoran Management (Admin)
        Route::get('jadwal-penyetoran', [JadwalPenyetoranController::class, 'index']);
        Route::get('jadwal-penyetoran/{jadwalPenyetoran}', [JadwalPenyetoranController::class, 'show']);
        Route::post('jadwal-penyetoran', [JadwalPenyetoranController::class, 'store']);
        Route::put('jadwal-penyetoran/{jadwalPenyetoran}', [JadwalPenyetoranController::class, 'update']);
        Route::delete('jadwal-penyetoran/{jadwalPenyetoran}', [JadwalPenyetoranController::class, 'destroy']);

        // Jenis Sampah Management (Admin)
        Route::get('jenis-sampah', [JenisSampahController::class, 'index']);
        Route::get('jenis-sampah/{id}', [JenisSampahController::class, 'show']);
        Route::post('jenis-sampah', [JenisSampahController::class, 'store']);
        Route::put('jenis-sampah/{id}', [JenisSampahController::class, 'update']);
        Route::delete('jenis-sampah/{id}', [JenisSampahController::class, 'destroy']);

        // Kategori Sampah / Waste Categories Management (Admin)
        Route::get('waste-categories', [KategoriSampahController::class, 'index']);
        Route::get('kategori-sampah', [KategoriSampahController::class, 'index']);
        Route::get('kategori-sampah/{id}', [KategoriSampahController::class, 'show']);
        Route::post('kategori-sampah', [KategoriSampahController::class, 'store']);
        Route::put('kategori-sampah/{id}', [KategoriSampahController::class, 'update']);
        Route::delete('kategori-sampah/{id}', [KategoriSampahController::class, 'destroy']);

        // Notification Management (Admin)
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/{notificationId}', [NotificationController::class, 'show']);
        Route::post('notifications', [NotificationController::class, 'store']);
        Route::delete('notifications/{notificationId}', [NotificationController::class, 'destroy']);
        Route::get('notifications/templates', function () {
            return response()->json([
                'status' => 'success',
                'data' => []
            ]);
        });
    });

    // Superadmin Management Routes
    Route::middleware('role:superadmin')->prefix('superadmin')->group(function () {
        // Admin Management
        Route::get('admins', [AdminManagementController::class, 'index']);
        Route::post('admins', [AdminManagementController::class, 'store']);
        Route::get('admins/{adminId}', [AdminManagementController::class, 'show']);
        Route::put('admins/{adminId}', [AdminManagementController::class, 'update']);
        Route::delete('admins/{adminId}', [AdminManagementController::class, 'destroy']);
        Route::get('admins/{adminId}/activity', [AdminManagementController::class, 'getActivity']);

        // Role Management
        Route::get('roles', [RoleManagementController::class, 'index']);
        Route::post('roles', [RoleManagementController::class, 'store']);
        Route::get('roles/{roleId}', [RoleManagementController::class, 'show']);
        Route::put('roles/{roleId}', [RoleManagementController::class, 'update']);
        Route::delete('roles/{roleId}', [RoleManagementController::class, 'destroy']);
        Route::get('roles/{roleId}/users', [RoleManagementController::class, 'getUsers']);

        // Permission Management
        Route::get('roles/{roleId}/permissions', [PermissionAssignmentController::class, 'index']);
        Route::post('roles/{roleId}/permissions', [PermissionAssignmentController::class, 'assign']);
        Route::post('roles/{roleId}/permissions/bulk', [PermissionAssignmentController::class, 'bulkAssign']);
        Route::delete('roles/{roleId}/permissions/{permissionId}', [PermissionAssignmentController::class, 'revoke']);
        Route::get('permissions', [PermissionAssignmentController::class, 'getAllPermissions']);

        // Audit Log Management
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/{logId}', [AuditLogController::class, 'show']);
        Route::get('system-logs', [AuditLogController::class, 'systemLogs']);
        Route::get('audit-logs/users/activity', [AuditLogController::class, 'userActivity']);
        Route::post('audit-logs/clear-old', [AuditLogController::class, 'clearOldLogs']);
        Route::get('audit-logs/export', [AuditLogController::class, 'export']);

        // System Settings Management
        Route::get('settings', [SystemSettingsController::class, 'index']);
        Route::get('settings/{key}', [SystemSettingsController::class, 'show']);
        Route::put('settings/{key}', [SystemSettingsController::class, 'update']);
        Route::get('health', [SystemSettingsController::class, 'health']);
        Route::get('cache-stats', [SystemSettingsController::class, 'cacheStats']);
        Route::post('cache/clear', [SystemSettingsController::class, 'clearCache']);
        Route::get('database-stats', [SystemSettingsController::class, 'databaseStats']);

        // Database Backup Management
        // NOTE: Excluded from Phase 1 - Backup dilakukan manual di level server
        // Route::post('backup', [SystemSettingsController::class, 'backup']);
        // Route::get('backups', [SystemSettingsController::class, 'listBackups']);
        // Route::delete('backups/{filename}', [SystemSettingsController::class, 'deleteBackup']);
    });
});

/*
|--------------------------------------------------------------------------
| User Profile Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user/{id}/poin', [PointController::class, 'getUserPoints']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user/{id}/redeem-history', [PointController::class, 'getRedeemHistory']);
    Route::get('user/{id}/poin/statistics', [PointController::class, 'getStatistics']);
    Route::get('users/{id}', [UserController::class, 'show']);
    Route::put('users/{id}', [UserController::class, 'update']);
    Route::post('users/{id}/update-photo', [UserController::class, 'updatePhoto']);
    Route::post('users/{id}/avatar', [UserController::class, 'uploadAvatar']);
    Route::get('users/{id}/badges', [UserController::class, 'badges']);
    Route::get('users/{userId}/badges-list', [BadgeController::class, 'getUserBadges']);
    Route::get('users/badges', [BadgeController::class, 'getUserBadges']);
    Route::get('users/{id}/aktivitas', [UserController::class, 'aktivitas']);

    // Badge Title Endpoints
    Route::get('users/{id}/badge-title', [UserController::class, 'getBadgeTitle']);
    Route::put('users/{id}/badge-title', [UserController::class, 'setBadgeTitle']);
    Route::get('users/{id}/unlocked-badges', [UserController::class, 'badgesList']);

    // User Feature Endpoints
    Route::get('users/{userId}/point-history', [UserController::class, 'pointHistory']);
    Route::get('users/{userId}/redeem-history', [UserController::class, 'redeemHistory']);
    Route::get('users/{userId}/tabung-sampah', [UserController::class, 'wasteDepositHistory']);
    Route::get('users/{userId}/dashboard/points', [UserController::class, 'dashboardPoints']);
});

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard/stats/{userId}', [DashboardController::class, 'getUserStats']);
    Route::get('dashboard/leaderboard', [DashboardController::class, 'getLeaderboard']);
});
Route::get('dashboard/global-stats', [DashboardController::class, 'getGlobalStats']);

/*
|--------------------------------------------------------------------------
| Badge & Reward Routes
|--------------------------------------------------------------------------
*/

Route::get('badges', [BadgeController::class, 'index']);
Route::get('users/{userId}/badge-progress', [BadgeController::class, 'getUserProgress']);
Route::post('users/{userId}/check-badges', [BadgeController::class, 'checkBadges']);

Route::post('tabung-sampah/{id}/approve', [TabungSampahController::class, 'approve']);
Route::post('tabung-sampah/{id}/reject', [TabungSampahController::class, 'reject']);

