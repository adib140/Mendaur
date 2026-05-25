<?php

namespace Database\Seeders;

use App\Models\PenukaranProduk;
use App\Models\User;
use App\Models\Produk;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PenukaranProdukSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Skip jika sudah ada data
        if (PenukaranProduk::count() > 0) {
            $this->command->info('⏭️  PenukaranProduk sudah ada data, skipped');
            return;
        }

        // Ambil beberapa users dan produk
        $users = User::where('role_id', 1)->take(10)->get();
        $produk = Produk::take(5)->get();

        if ($users->isEmpty() || $produk->isEmpty()) {
            $this->command->info('⚠️  Users atau Produk tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        $statuses = ['pending', 'approved', 'cancelled'];
        $metodes = ['pickup', 'delivery', 'email'];

        foreach ($users as $user) {
            for ($i = 0; $i < 3; $i++) {
                $selectedProduk = $produk->random();

                PenukaranProduk::create([
                    'user_id' => $user->user_id,
                    'produk_id' => $selectedProduk->produk_id,
                    'nama_produk' => $selectedProduk->nama,
                    'poin_digunakan' => $selectedProduk->poin_ditukar ?? 500 + ($i * 100),
                    'jumlah' => rand(1, 3),
                    'status' => $statuses[array_rand($statuses)],
                    'metode_ambil' => $metodes[array_rand($metodes)],
                    'catatan' => $this->getRandomCatatan(),
                    'tanggal_penukaran' => Carbon::now()->subDays(rand(1, 30)),
                    'tanggal_diambil' => rand(0, 1) ? Carbon::now()->subDays(rand(1, 15)) : null,
                ]);
            }
        }

        $this->command->info('✅ PenukaranProduk seeder berhasil dijalankan');
    }

    private function getRandomCatatan(): ?string
    {
        $catatan = [
            'Produk sudah diterima dengan baik',
            'Menunggu konfirmasi pengiriman',
            'Produk belum diklaim',
            'Dikirim via kurir',
            'Diambil sendiri di kantor',
            null,
        ];

        return $catatan[array_rand($catatan)];
    }
}
