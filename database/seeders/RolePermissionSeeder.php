<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Roles using firstOrCreate to avoid duplicates
        $nasabahRole = Role::firstOrCreate(
            ['nama_role' => 'nasabah'],
            [
                'level_akses' => 1,
                'deskripsi' => 'Regular user/nasabah yang dapat menyetor sampah dan menukar poin',
            ]
        );

        $adminRole = Role::firstOrCreate(
            ['nama_role' => 'admin'],
            [
                'level_akses' => 2,
                'deskripsi' => 'Admin staff yang dapat mengelola depositan dan nasabah',
            ]
        );

        $superadminRole = Role::firstOrCreate(
            ['nama_role' => 'superadmin'],
            [
                'level_akses' => 3,
                'deskripsi' => 'Super admin yang dapat mengelola admin dan sistem keseluruhan',
            ]
        );

        // ===== NASABAH PERMISSIONS (17 total) =====
        $nasabahPermissions = [
            // Core Features
            'deposit_sampah' => 'Dapat menyetor sampah',
            'view_deposit_history' => 'Dapat melihat riwayat penyetoran',
            'view_balance' => 'Dapat melihat saldo poin',
            'view_transaction_history' => 'Dapat melihat riwayat transaksi',

            // Poin Features
            'redeem_poin' => 'Dapat menukar poin dengan produk',
            'view_redemption_history' => 'Dapat melihat riwayat penukaran',
            'request_withdrawal' => 'Dapat mengajukan penarikan tunai',
            'view_withdrawal_history' => 'Dapat melihat riwayat penarikan',

            // Gamification
            'view_badges' => 'Dapat melihat badge yang dimiliki',
            'view_all_badges' => 'Dapat melihat semua badge yang tersedia',
            'view_badge_progress' => 'Dapat melihat progress badge',

            // Community
            'view_leaderboard' => 'Dapat melihat leaderboard',
            'view_leaderboard_detail' => 'Dapat melihat detail leaderboard',

            // Account
            'view_profile' => 'Dapat melihat profil sendiri',
            'edit_profile' => 'Dapat edit profil sendiri',
            'view_activity_log' => 'Dapat melihat log aktivitas sendiri',
            'view_notifications' => 'Dapat melihat notifikasi',
        ];

        foreach ($nasabahPermissions as $code => $description) {
            RolePermission::firstOrCreate(
                [
                    'role_id' => $nasabahRole->role_id,
                    'permission_code' => $code,
                ],
                ['deskripsi' => $description]
            );
        }

        // ===== ADMIN PERMISSIONS (23 additional, includes all nasabah) =====
        // First, admin inherits all nasabah permissions (17)
        foreach ($nasabahPermissions as $code => $description) {
            RolePermission::firstOrCreate(
                [
                    'role_id' => $adminRole->role_id,
                    'permission_code' => $code,
                ],
                ['deskripsi' => $description]
            );
        }

        // Then add admin-specific permissions (23 additional)
        $adminPermissions = [
            // Deposit Management
            'approve_deposit' => 'Dapat menyetujui penyetoran sampah',
            'reject_deposit' => 'Dapat menolak penyetoran sampah',
            'view_all_deposits' => 'Dapat melihat semua penyetoran',
            'view_deposit_detail' => 'Dapat melihat detail penyetoran',

            // Poin Management
            'adjust_poin_manual' => 'Dapat menyesuaikan poin secara manual',
            'view_poin_adjustment_history' => 'Dapat melihat riwayat penyesuaian poin',

            // Redemption Management
            'approve_redemption' => 'Dapat menyetujui penukaran poin',
            'reject_redemption' => 'Dapat menolak penukaran poin',
            'view_all_redemptions' => 'Dapat melihat semua penukaran',

            // Withdrawal Management
            'approve_withdrawal' => 'Dapat menyetujui penarikan tunai',
            'reject_withdrawal' => 'Dapat menolak penarikan tunai',
            'view_all_withdrawals' => 'Dapat melihat semua penarikan',

            // User Management
            'view_all_users' => 'Dapat melihat semua nasabah',
            'view_user_detail' => 'Dapat melihat detail nasabah',
            'view_user_activity_log' => 'Dapat melihat log aktivitas nasabah',
            'view_user_badges' => 'Dapat melihat badge nasabah',
            'view_user_balance' => 'Dapat melihat saldo poin nasabah',

            // Badge Management
            'manage_badges' => 'Dapat mengelola badge',
            'assign_badge_manual' => 'Dapat memberikan badge secara manual',

            // Product Management (Admin can view only, not create)
            'view_all_products' => 'Dapat melihat semua produk',
            'view_product_detail' => 'Dapat melihat detail produk',

            // Reports
            'view_dashboard' => 'Dapat melihat dashboard admin',
            'export_reports' => 'Dapat export laporan',
        ];

        foreach ($adminPermissions as $code => $description) {
            RolePermission::firstOrCreate(
                [
                    'role_id' => $adminRole->role_id,
                    'permission_code' => $code,
                ],
                ['deskripsi' => $description]
            );
        }

        // ===== SUPERADMIN PERMISSIONS (40+ total: all above + 17 more) =====
        // First, superadmin inherits all nasabah permissions (17)
        foreach ($nasabahPermissions as $code => $description) {
            RolePermission::firstOrCreate(
                [
                    'role_id' => $superadminRole->role_id,
                    'permission_code' => $code,
                ],
                ['deskripsi' => $description]
            );
        }

        // Then all admin permissions (23)
        foreach ($adminPermissions as $code => $description) {
            RolePermission::firstOrCreate(
                [
                    'role_id' => $superadminRole->role_id,
                    'permission_code' => $code,
                ],
                ['deskripsi' => $description]
            );
        }

        // Finally, superadmin-specific permissions (17+ additional)
        $superadminPermissions = [
            // Admin Management
            'create_admin' => 'Dapat membuat admin baru',
            'edit_admin' => 'Dapat edit data admin',
            'delete_admin' => 'Dapat hapus admin',
            'view_all_admins' => 'Dapat melihat semua admin',
            'view_admin_detail' => 'Dapat melihat detail admin',
            'view_admin_activity_log' => 'Dapat melihat log aktivitas admin',

            // Role & Permission Management
            'manage_roles' => 'Dapat mengelola role',
            'create_role' => 'Dapat membuat role baru',
            'edit_role' => 'Dapat edit role',
            'delete_role' => 'Dapat hapus role',
            'manage_permissions' => 'Dapat mengelola permission',
            'assign_permission' => 'Dapat memberikan permission ke role',
            'revoke_permission' => 'Dapat mencabut permission dari role',

            // Audit & Security
            'view_audit_logs' => 'Dapat melihat log audit semua admin',
            'view_system_logs' => 'Dapat melihat log sistem',

            // Product Management (Superadmin can full CRUD)
            'create_product' => 'Dapat membuat produk baru',
            'edit_product' => 'Dapat edit produk',
            'delete_product' => 'Dapat hapus produk',

            // System Configuration
            'manage_system_settings' => 'Dapat mengelola pengaturan sistem',
            'manage_articles' => 'Dapat mengelola artikel',
            'backup_database' => 'Dapat backup database',
            'view_system_health' => 'Dapat melihat kesehatan sistem',
        ];

        foreach ($superadminPermissions as $code => $description) {
            RolePermission::firstOrCreate(
                [
                    'role_id' => $superadminRole->role_id,
                    'permission_code' => $code,
                ],
                ['deskripsi' => $description]
            );
        }

        $this->command->info('Roles and permissions seeded successfully!');
        $this->command->info('Total permissions created:');
        $this->command->info('  - Nasabah: ' . count($nasabahPermissions));
        $this->command->info('  - Admin (inherited + specific): ' . (count($nasabahPermissions) + count($adminPermissions)));
        $this->command->info('  - Superadmin (inherited + specific): ' . (count($nasabahPermissions) + count($adminPermissions) + count($superadminPermissions)));
    }
}
