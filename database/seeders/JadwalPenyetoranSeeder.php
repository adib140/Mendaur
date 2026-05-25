<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JadwalPenyetoranSeeder extends Seeder
{
    public function run(): void
    {
        // Schema setelah migrasi 2025_12_23:
        // - tanggal (date) → hari (enum: Senin-Minggu)
        // - status → enum 'Buka', 'Tutup'
        // - kapasitas dihapus

        $jadwalList = [
            [
                'hari' => 'Senin',
                'waktu_mulai' => '08:00:00',
                'waktu_selesai' => '10:00:00',
                'lokasi' => 'TPS 3R Metro Barat',
                'status' => 'Buka',
            ],
            [
                'hari' => 'Senin',
                'waktu_mulai' => '14:00:00',
                'waktu_selesai' => '16:00:00',
                'lokasi' => 'Bank Sampah Induk Nusa',
                'status' => 'Buka',
            ],
            [
                'hari' => 'Selasa',
                'waktu_mulai' => '09:00:00',
                'waktu_selesai' => '11:00:00',
                'lokasi' => 'TPS 3R Metro Selatan',
                'status' => 'Buka',
            ],
            [
                'hari' => 'Rabu',
                'waktu_mulai' => '08:00:00',
                'waktu_selesai' => '11:00:00',
                'lokasi' => 'TPS 3R Metro Barat',
                'status' => 'Buka',
            ],
            [
                'hari' => 'Kamis',
                'waktu_mulai' => '08:00:00',
                'waktu_selesai' => '12:00:00',
                'lokasi' => 'Bank Sampah Induk Nusa',
                'status' => 'Buka',
            ],
            [
                'hari' => 'Jumat',
                'waktu_mulai' => '09:00:00',
                'waktu_selesai' => '11:00:00',
                'lokasi' => 'TPS 3R Metro Selatan',
                'status' => 'Buka',
            ],
            [
                'hari' => 'Sabtu',
                'waktu_mulai' => '08:00:00',
                'waktu_selesai' => '14:00:00',
                'lokasi' => 'TPS 3R Metro Barat',
                'status' => 'Buka',
            ],
        ];

        foreach ($jadwalList as $jadwal) {
            DB::table('jadwal_penyetorans')->updateOrInsert(
                [
                    'hari' => $jadwal['hari'],
                    'waktu_mulai' => $jadwal['waktu_mulai'],
                    'lokasi' => $jadwal['lokasi'],
                ], // Unique key combination
                array_merge($jadwal, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
