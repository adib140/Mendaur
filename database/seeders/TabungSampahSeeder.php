<?php

namespace Database\Seeders;

use App\Models\TabungSampah;
use App\Models\User;
use App\Models\JadwalPenyetoran;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class TabungSampahSeeder extends Seeder
{
    public function run(): void
    {
        // Skip jika sudah ada data
        if (TabungSampah::count() > 0) {
            $this->command->info('⏭️  TabungSampah sudah ada data, skipped');
            return;
        }

        // Ambil users dan jadwal penyetoran
        $users = User::where('role_id', 1)->take(15)->get();
        $jadwals = JadwalPenyetoran::all();

        if ($users->isEmpty() || $jadwals->isEmpty()) {
            $this->command->info('⚠️  Users atau JadwalPenyetoran tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        // Daftar jenis sampah yang realistis
        $jenisSampahList = ['Plastik', 'Kertas', 'Logam', 'Kaca', 'Organik', 'Elektronik'];
        $statuses = ['pending', 'approved', 'rejected'];
        $lokasi = ['Rumah', 'Kantor', 'Toko', 'Sekolah', 'Mal', 'Apartemen'];
        $totalDeposits = 0;

        foreach ($users as $user) {
            // Setiap user membuat 5-10 deposit
            for ($i = 0; $i < rand(5, 10); $i++) {
                $jadwal = $jadwals->random();
                $beratKg = rand(5, 50) + (rand(0, 99) / 100);
                $status = $statuses[array_rand($statuses)];
                $poinDidapat = 0;

                if ($status === 'approved') {
                    // Hitung poin: berat * harga / 100
                    // Asumsi: Plastik = 5000/kg, Kertas = 2000/kg, Logam = 10000/kg
                    $poinDidapat = (int) floor($beratKg * rand(2000, 10000) / 100);
                    $totalDeposits++;
                }

                TabungSampah::create([
                    'user_id' => $user->user_id,
                    'jadwal_penyetoran_id' => $jadwal->jadwal_penyetoran_id,
                    'nama_lengkap' => $user->nama ?? 'User ' . $user->user_id,
                    'no_hp' => $user->no_hp ?? '08' . rand(1000000000, 9999999999),
                    'titik_lokasi' => $lokasi[array_rand($lokasi)] . ' - ' . 'Jalan ' . rand(1, 100),
                    'jenis_sampah' => $jenisSampahList[array_rand($jenisSampahList)],
                    'berat_kg' => $beratKg,
                    'foto_sampah' => null,
                    'status' => $status,
                    'poin_didapat' => $poinDidapat,
                ]);
            }
        }

        $this->command->info("✅ TabungSampah seeder berhasil dijalankan (Total: " . ($totalDeposits * 2) . " deposits created, Approved: {$totalDeposits})");
    }
}
