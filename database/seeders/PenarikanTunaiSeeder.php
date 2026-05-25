<?php

namespace Database\Seeders;

use App\Models\PenarikanTunai;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PenarikanTunaiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Skip jika sudah ada data
        if (PenarikanTunai::count() > 0) {
            $this->command->info('⏭️  PenarikanTunai sudah ada data, skipped');
            return;
        }

        // Ambil beberapa users
        $users = User::where('role_id', 1)->take(10)->get();
        $admins = User::where('role_id', '>=', 2)->get();

        if ($users->isEmpty()) {
            $this->command->info('⚠️  Users tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        $statuses = ['pending', 'approved', 'rejected'];
        $banks = ['BCA', 'Mandiri', 'BRI', 'BTN', 'Permata', 'CIMB Niaga'];
        $jumlahOptions = [50000, 100000, 150000, 200000, 250000, 500000];
        $poinOptions = [500, 1000, 1500, 2000, 2500, 5000];

        foreach ($users as $user) {
            for ($i = 0; $i < rand(2, 4); $i++) {
                $status = $statuses[array_rand($statuses)];
                $tanggalRequest = Carbon::now()->subDays(rand(1, 30));
                $processedAt = ($status !== 'pending')
                    ? $tanggalRequest->clone()->addDays(rand(1, 5))
                    : null;
                $processedBy = ($status !== 'pending' && $admins->isNotEmpty())
                    ? $admins->random()->user_id
                    : null;

                PenarikanTunai::create([
                    'user_id' => $user->user_id,
                    'jumlah_poin' => $poinOptions[array_rand($poinOptions)],
                    'jumlah_rupiah' => $jumlahOptions[array_rand($jumlahOptions)],
                    'nomor_rekening' => rand(1000000000, 9999999999),
                    'nama_bank' => $banks[array_rand($banks)],
                    'nama_penerima' => $user->nama ?? 'User ' . $user->user_id,
                    'status' => $status,
                    'catatan_admin' => $status === 'rejected' ? $this->getRandomCatatan() : null,
                    'processed_by' => $processedBy,
                    'processed_at' => $processedAt,
                ]);
            }
        }

        $this->command->info('✅ PenarikanTunai seeder berhasil dijalankan');
    }

    private function getRandomCatatan(): string
    {
        $catatan = [
            'Rekening tidak valid',
            'Data pemilik rekening tidak sesuai',
            'Saldo poin tidak cukup untuk diproses',
            'Terjadi masalah dengan bank',
            'Nomor rekening tidak aktif',
        ];

        return $catatan[array_rand($catatan)];
    }
}
