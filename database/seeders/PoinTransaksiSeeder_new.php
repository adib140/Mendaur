<?php

namespace Database\Seeders;

use App\Models\PoinTransaksi;
use App\Models\User;
use App\Models\TabungSampah;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PoinTransaksiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::where('role_id', 1)->take(15)->get();
        $deposits = TabungSampah::where('status', 'approved')->get();

        if ($users->isEmpty()) {
            $this->command->info('⚠️  Users tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        $sources = ['setor_sampah', 'bonus', 'event', 'manual', 'badge', 'redemption'];
        $totalTransaksi = 0;

        foreach ($users as $user) {
            // Setiap user membuat 10-20 transaksi
            for ($i = 0; $i < rand(10, 20); $i++) {
                $source = $sources[array_rand($sources)];
                $tanggalTransaksi = Carbon::now()->subDays(rand(1, 60));

                // Ambil poin didapat berdasarkan sumber
                $poinDidapat = match($source) {
                    'setor_sampah' => rand(50, 500),
                    'bonus' => rand(100, 500),
                    'event' => rand(50, 300),
                    'manual' => rand(-200, 500),
                    'badge' => rand(100, 1000),
                    'redemption' => -rand(100, 2000),
                    default => rand(50, 200),
                };

                // Ambil deposit jika sumber adalah setor_sampah
                $deposit = ($source === 'setor_sampah' && $deposits->isNotEmpty())
                    ? $deposits->random()
                    : null;

                PoinTransaksi::create([
                    'user_id' => $user->user_id,
                    'tabung_sampah_id' => $deposit?->tabung_sampah_id,
                    'jenis_sampah' => $deposit?->jenis_sampah ?? null,
                    'berat_kg' => $deposit?->berat_kg ?? null,
                    'poin_didapat' => $poinDidapat,
                    'sumber' => $source,
                    'keterangan' => $this->getKeterangan($source),
                    'referensi_id' => rand(1, 1000),
                    'referensi_tipe' => $source,
                    'created_at' => $tanggalTransaksi,
                    'updated_at' => $tanggalTransaksi,
                ]);

                $totalTransaksi++;
            }
        }

        $this->command->info("✅ PoinTransaksi seeder berhasil dijalankan (Total: {$totalTransaksi} transaksi)");
    }

    private function getKeterangan(string $sumber): string
    {
        $keterangan = match($sumber) {
            'setor_sampah' => 'Poin dari penyetoran sampah',
            'bonus' => 'Bonus poin dari program referral',
            'event' => 'Poin dari event khusus',
            'manual' => 'Adjustment manual oleh admin',
            'badge' => 'Reward dari pencapaian badge',
            'redemption' => 'Penggunaan poin untuk penukaran produk',
            default => 'Transaksi poin'
        };

        return $keterangan;
    }
}
