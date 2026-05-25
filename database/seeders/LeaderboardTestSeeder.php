<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\PoinTransaksi;
use App\Services\PointService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class LeaderboardTestSeeder extends Seeder
{
    /**
     * Create test users with diverse poin for leaderboard testing
     */
    public function run(): void
    {
        $this->command->info('🎯 Creating test users with diverse poin...');

        // Generate unique phone numbers based on timestamp
        $baseTime = time();

        // Create test users with various poin amounts
        $testUsers = [
            [
                'nama' => 'Andi Pratama',
                'email' => 'andi.test@example.com',
                'no_hp' => '081' . substr($baseTime, -8),
                'poin_transactions' => [
                    ['amount' => 2000, 'source' => 'setor_sampah', 'desc' => 'Setor sampah plastik 20kg'],
                    ['amount' => 1500, 'source' => 'bonus', 'desc' => 'Bonus aktif bulan ini'],
                    ['amount' => 800, 'source' => 'setor_sampah', 'desc' => 'Setor sampah kertas 15kg'],
                    ['amount' => -500, 'source' => 'penukaran_produk', 'desc' => 'Tukar voucher Grab'],
                ]
            ],
            [
                'nama' => 'Budi Santoso',
                'email' => 'budi.test@example.com',
                'no_hp' => '082' . substr($baseTime + 1, -8),
                'poin_transactions' => [
                    ['amount' => 5000, 'source' => 'setor_sampah', 'desc' => 'Setor sampah organik 50kg'],
                    ['amount' => 2500, 'source' => 'event', 'desc' => 'Event bersih-bersih lingkungan'],
                    ['amount' => 1000, 'source' => 'badge', 'desc' => 'Badge Eco Warrior achievement'],
                    ['amount' => -2000, 'source' => 'penarikan_tunai', 'desc' => 'Penarikan tunai Rp 20.000'],
                ]
            ],
            [
                'nama' => 'Citra Dewi',
                'email' => 'citra.test@example.com',
                'no_hp' => '083' . substr($baseTime + 2, -8),
                'poin_transactions' => [
                    ['amount' => 3500, 'source' => 'setor_sampah', 'desc' => 'Setor sampah elektronik'],
                    ['amount' => 1200, 'source' => 'bonus', 'desc' => 'Bonus referral teman'],
                    ['amount' => 800, 'source' => 'setor_sampah', 'desc' => 'Setor sampah botol kaca'],
                ]
            ],
            [
                'nama' => 'Dedi Rahman',
                'email' => 'dedi.test@example.com',
                'no_hp' => '084' . substr($baseTime + 3, -8),
                'poin_transactions' => [
                    ['amount' => 8000, 'source' => 'setor_sampah', 'desc' => 'Setor sampah besar 80kg'],
                    ['amount' => 3000, 'source' => 'event', 'desc' => 'Juara lomba daur ulang'],
                    ['amount' => 1500, 'source' => 'bonus', 'desc' => 'Bonus konsisten 3 bulan'],
                    ['amount' => -1000, 'source' => 'penukaran_produk', 'desc' => 'Tukar tas eco-friendly'],
                    ['amount' => -3000, 'source' => 'penarikan_tunai', 'desc' => 'Penarikan tunai Rp 30.000'],
                ]
            ],
            [
                'nama' => 'Eka Putri',
                'email' => 'eka.test@example.com',
                'no_hp' => '085' . substr($baseTime + 4, -8),
                'poin_transactions' => [
                    ['amount' => 1800, 'source' => 'setor_sampah', 'desc' => 'Setor sampah plastik'],
                    ['amount' => 700, 'source' => 'bonus', 'desc' => 'Bonus user baru'],
                ]
            ],
            [
                'nama' => 'Fajar Kurniawan',
                'email' => 'fajar.test@example.com',
                'no_hp' => '086' . substr($baseTime + 5, -8),
                'poin_transactions' => [
                    ['amount' => 12000, 'source' => 'setor_sampah', 'desc' => 'Setor sampah industri 120kg'],
                    ['amount' => 5000, 'source' => 'event', 'desc' => 'Juara 1 kompetisi recycle'],
                    ['amount' => 2000, 'source' => 'badge', 'desc' => 'Multiple badge achievement'],
                    ['amount' => -4000, 'source' => 'penarikan_tunai', 'desc' => 'Penarikan tunai Rp 40.000'],
                ]
            ]
        ];

        foreach ($testUsers as $userData) {
            // Create user
            $user = User::create([
                'nama' => $userData['nama'],
                'email' => $userData['email'],
                'no_hp' => $userData['no_hp'],
                'password' => Hash::make('password123'),
                'alamat' => 'Jl. Test No. ' . rand(1, 999) . ', Metro Test',
                'level' => 'Pemula',
                'role_id' => 1, // Nasabah role
                'status' => 'active',
                'tipe_nasabah' => 'konvensional',
                'total_poin' => 0, // Will be calculated from transactions
                'total_setor_sampah' => 0,
            ]);

            // Create poin transactions
            $totalPoin = 0;
            foreach ($userData['poin_transactions'] as $transaction) {
                PoinTransaksi::create([
                    'user_id' => $user->user_id,
                    'poin_didapat' => $transaction['amount'],
                    'sumber' => $transaction['source'],
                    'keterangan' => $transaction['desc'],
                ]);

                $totalPoin += $transaction['amount'];
            }

            // Update total_poin based on transactions
            $user->update(['total_poin' => $totalPoin]);

            $this->command->info("✅ Created {$userData['nama']} with {$totalPoin} poin");
        }

        $this->command->info('🎉 Test users created successfully!');
        $this->command->info('👥 Users created: ' . count($testUsers));
        $this->command->info('💰 Total poin transactions: ' . PoinTransaksi::count());
    }
}
