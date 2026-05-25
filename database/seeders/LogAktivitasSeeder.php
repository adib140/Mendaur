<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LogAktivitas;
use Carbon\Carbon;

class LogAktivitasSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $activities = [
            // User 1 (Adib) - Bronze, 150 points
            [
                'user_id' => 1,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 5kg sampah plastik',
                'poin_perubahan' => 15,
                'tanggal' => Carbon::now()->subDays(10),
            ],
            [
                'user_id' => 1,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Pemula Peduli' dan bonus 50 poin",
                'poin_perubahan' => 50,
                'tanggal' => Carbon::now()->subDays(10),
            ],
            [
                'user_id' => 1,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 3kg sampah kertas',
                'poin_perubahan' => 9,
                'tanggal' => Carbon::now()->subDays(8),
            ],
            [
                'user_id' => 1,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 4kg sampah botol',
                'poin_perubahan' => 12,
                'tanggal' => Carbon::now()->subDays(5),
            ],
            [
                'user_id' => 1,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Eco Warrior' dan bonus 100 poin",
                'poin_perubahan' => 100,
                'tanggal' => Carbon::now()->subDays(5),
            ],
            [
                'user_id' => 1,
                'tipe_aktivitas' => LogAktivitas::TYPE_POIN_BONUS,
                'deskripsi' => 'Bonus poin dari event khusus',
                'poin_perubahan' => 20,
                'tanggal' => Carbon::now()->subDays(3),
            ],

            // User 2 (Siti) - Silver, 300 points
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 7kg sampah plastik',
                'poin_perubahan' => 21,
                'tanggal' => Carbon::now()->subDays(15),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Pemula Peduli' dan bonus 50 poin",
                'poin_perubahan' => 50,
                'tanggal' => Carbon::now()->subDays(15),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 6kg sampah organik',
                'poin_perubahan' => 18,
                'tanggal' => Carbon::now()->subDays(12),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Eco Warrior' dan bonus 100 poin",
                'poin_perubahan' => 100,
                'tanggal' => Carbon::now()->subDays(12),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Bronze Collector' dan bonus 100 poin",
                'poin_perubahan' => 100,
                'tanggal' => Carbon::now()->subDays(10),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 5kg sampah kertas',
                'poin_perubahan' => 15,
                'tanggal' => Carbon::now()->subDays(7),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Green Hero' dan bonus 200 poin",
                'poin_perubahan' => 200,
                'tanggal' => Carbon::now()->subDays(7),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_TUKAR_POIN,
                'deskripsi' => 'Menukar 100 poin dengan Voucher Grab',
                'poin_perubahan' => -100,
                'tanggal' => Carbon::now()->subDays(4),
            ],
            [
                'user_id' => 2,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Silver Collector' dan bonus 200 poin",
                'poin_perubahan' => 200,
                'tanggal' => Carbon::now()->subDays(2),
            ],

            // User 3 (Budi) - Pemula, 50 points
            [
                'user_id' => 3,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 2kg sampah plastik',
                'poin_perubahan' => 6,
                'tanggal' => Carbon::now()->subDays(5),
            ],
            [
                'user_id' => 3,
                'tipe_aktivitas' => LogAktivitas::TYPE_BADGE_UNLOCK,
                'deskripsi' => "Mendapatkan badge 'Pemula Peduli' dan bonus 50 poin",
                'poin_perubahan' => 50,
                'tanggal' => Carbon::now()->subDays(5),
            ],
            [
                'user_id' => 3,
                'tipe_aktivitas' => LogAktivitas::TYPE_SETOR_SAMPAH,
                'deskripsi' => 'Menyetor 3kg sampah botol',
                'poin_perubahan' => 9,
                'tanggal' => Carbon::now()->subDays(2),
            ],
            [
                'user_id' => 3,
                'tipe_aktivitas' => LogAktivitas::TYPE_TUKAR_POIN,
                'deskripsi' => 'Menukar 15 poin dengan merchandise',
                'poin_perubahan' => -15,
                'tanggal' => Carbon::now()->subDay(),
            ],
        ];

        foreach ($activities as $activity) {
            LogAktivitas::updateOrCreate(
                [
                    'user_id' => $activity['user_id'],
                    'deskripsi' => $activity['deskripsi'],
                    'tanggal' => $activity['tanggal'],
                ], // Unique key combination
                $activity
            );
        }
    }
}
