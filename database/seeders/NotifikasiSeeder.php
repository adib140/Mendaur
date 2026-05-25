<?php

namespace Database\Seeders;

use App\Models\Notifikasi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class NotifikasiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Skip jika sudah ada data
        if (Notifikasi::count() > 0) {
            $this->command->info('⏭️  Notifikasi sudah ada data, skipped');
            return;
        }

        $users = User::where('role_id', 1)->take(15)->get();

        if ($users->isEmpty()) {
            $this->command->info('⚠️  Users tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        $tipeNotifikasi = [
            'penyetoran_disetujui',
            'penyetoran_ditolak',
            'penukaran_disetujui',
            'penukaran_ditolak',
            'penarikan_disetujui',
            'penarikan_ditolak',
            'badge_baru',
            'poin_bonus',
            'jadwal_penyetoran',
            'promo',
        ];

        $totalNotifikasi = 0;

        foreach ($users as $user) {
            // Setiap user mendapat 5-15 notifikasi
            for ($i = 0; $i < rand(5, 15); $i++) {
                $tipe = $tipeNotifikasi[array_rand($tipeNotifikasi)];
                $isRead = rand(0, 1);
                $tanggalNotifikasi = Carbon::now()->subDays(rand(1, 30));

                Notifikasi::create([
                    'user_id' => $user->user_id,
                    'tipe' => $tipe,
                    'judul' => $this->getJudulByTipe($tipe),
                    'pesan' => $this->getPesanByTipe($tipe),
                    'is_read' => $isRead,
                    'created_at' => $tanggalNotifikasi,
                    'updated_at' => $tanggalNotifikasi,
                ]);

                $totalNotifikasi++;
            }
        }

        $this->command->info("✅ Notifikasi seeder berhasil dijalankan (Total: {$totalNotifikasi} notifikasi)");
    }

    private function getJudulByTipe(string $tipe): string
    {
        $judul = [
            'penyetoran_disetujui' => 'Penyetoran Sampah Disetujui ✅',
            'penyetoran_ditolak' => 'Penyetoran Sampah Ditolak ❌',
            'penukaran_disetujui' => 'Penukaran Produk Disetujui ✅',
            'penukaran_ditolak' => 'Penukaran Produk Ditolak ❌',
            'penarikan_disetujui' => 'Penarikan Tunai Disetujui ✅',
            'penarikan_ditolak' => 'Penarikan Tunai Ditolak ❌',
            'badge_baru' => 'Badge Baru Diperoleh 🎖️',
            'poin_bonus' => 'Bonus Poin Tersedia 🎁',
            'jadwal_penyetoran' => 'Jadwal Penyetoran Dimulai 📅',
            'promo' => 'Promo Spesial untuk Anda 🎉',
        ];

        return $judul[$tipe] ?? 'Notifikasi Baru';
    }

    private function getPesanByTipe(string $tipe): string
    {
        $pesan = [
            'penyetoran_disetujui' => 'Penyetoran sampah Anda seberat 5kg telah disetujui. Poin Anda +250 poin 🎉',
            'penyetoran_ditolak' => 'Penyetoran sampah Anda tidak sesuai standar. Silakan hubungi admin untuk informasi lebih lanjut.',
            'penukaran_disetujui' => 'Penukaran produk Anda telah disetujui. Silakan ambil di kantor kami atau tunggu pengiriman.',
            'penukaran_ditolak' => 'Penukaran produk Anda ditolak karena poin tidak mencukupi atau produk habis.',
            'penarikan_disetujui' => 'Penarikan tunai Anda sebesar Rp 100.000 telah disetujui.',
            'penarikan_ditolak' => 'Penarikan tunai Anda ditolak. Silakan cek kembali data dan coba lagi.',
            'badge_baru' => 'Selamat! Anda baru saja mendapatkan badge "Eco Warrior" karena kontribusi sampah yang luar biasa!',
            'poin_bonus' => 'Anda mendapatkan bonus 100 poin karena mengikuti program referral! 🌟',
            'jadwal_penyetoran' => 'Jadwal penyetoran sampah hari ini pukul 14:00 di lokasi Jalan Sudirman. Siapkan sampah Anda!',
            'promo' => 'Promo spesial bulan ini: Tukar poin Anda dengan diskon hingga 50% untuk semua produk premium! ✨',
        ];

        return $pesan[$tipe] ?? 'Anda memiliki notifikasi baru';
    }
}
