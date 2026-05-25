<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            // RBAC System - Must run first as other seeders may depend on roles
            RolePermissionSeeder::class,

            UserSeeder::class,
            KategoriSampahSeeder::class,  // ⭐ Must run BEFORE JenisSampahSeeder (FK constraint)
            JenisSampahSeeder::class,
            KategoriTransaksiSeeder::class,
            JadwalPenyetoranSeeder::class,
            ProdukSeeder::class,
            BadgeSeeder::class,
            ArtikelSeeder::class,
            LogAktivitasSeeder::class,
            BadgeProgressSeeder::class,

            // ✨ NEW: Feature Seeders
            TabungSampahSeeder::class,      // Waste deposit data
            PenukaranProdukSeeder::class,   // Product exchange data
            PenarikanTunaiSeeder::class,    // Cash withdrawal data
            UserBadgeSeeder::class,         // User badge assignments
            NotifikasiSeeder::class,        // Notification data
            PoinTransaksiSeeder::class,     // Point transaction data
            PoinCorrectionSeeder::class,    // Point correction data
        ]);
    }
}
