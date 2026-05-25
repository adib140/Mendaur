<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class JenisSampahSeeder extends Seeder
{
    public function run(): void
    {
        $jenisSampah = [
            // PLASTIK (kategori_id = 1)
            ['kategori_sampah_id' => 1, 'nama_jenis' => 'PET (Botol Minuman)', 'harga_per_kg' => 3000, 'kode' => 'PLS-PET'],
            ['kategori_sampah_id' => 1, 'nama_jenis' => 'HDPE (Jerigen/Galon)', 'harga_per_kg' => 2500, 'kode' => 'PLS-HDPE'],
            ['kategori_sampah_id' => 1, 'nama_jenis' => 'PVC (Pipa Plastik)', 'harga_per_kg' => 1000, 'kode' => 'PLS-PVC'],
            ['kategori_sampah_id' => 1, 'nama_jenis' => 'PP (Ember/Kursi Plastik)', 'harga_per_kg' => 2000, 'kode' => 'PLS-PP'],
            ['kategori_sampah_id' => 1, 'nama_jenis' => 'PS (Styrofoam)', 'harga_per_kg' => 800, 'kode' => 'PLS-PS'],

            // KERTAS (kategori_id = 2)
            ['kategori_sampah_id' => 2, 'nama_jenis' => 'Kertas HVS/Putih', 'harga_per_kg' => 2000, 'kode' => 'KRT-HVS'],
            ['kategori_sampah_id' => 2, 'nama_jenis' => 'Kardus', 'harga_per_kg' => 1500, 'kode' => 'KRT-KDS'],
            ['kategori_sampah_id' => 2, 'nama_jenis' => 'Koran/Majalah', 'harga_per_kg' => 1200, 'kode' => 'KRT-KRN'],
            ['kategori_sampah_id' => 2, 'nama_jenis' => 'Kertas Campur', 'harga_per_kg' => 1000, 'kode' => 'KRT-CMP'],

            // LOGAM (kategori_id = 3)
            ['kategori_sampah_id' => 3, 'nama_jenis' => 'Besi/Baja', 'harga_per_kg' => 3500, 'kode' => 'LGM-BSI'],
            ['kategori_sampah_id' => 3, 'nama_jenis' => 'Aluminium', 'harga_per_kg' => 8000, 'kode' => 'LGM-ALU'],
            ['kategori_sampah_id' => 3, 'nama_jenis' => 'Tembaga', 'harga_per_kg' => 70000, 'kode' => 'LGM-TMB'],
            ['kategori_sampah_id' => 3, 'nama_jenis' => 'Kaleng', 'harga_per_kg' => 2500, 'kode' => 'LGM-KLG'],

            // KACA (kategori_id = 4)
            ['kategori_sampah_id' => 4, 'nama_jenis' => 'Kaca Bening', 'harga_per_kg' => 1500, 'kode' => 'KCA-BNG'],
            ['kategori_sampah_id' => 4, 'nama_jenis' => 'Kaca Warna', 'harga_per_kg' => 1200, 'kode' => 'KCA-WRN'],
            ['kategori_sampah_id' => 4, 'nama_jenis' => 'Kaca Pecahan', 'harga_per_kg' => 800, 'kode' => 'KCA-PCH'],

            // ELEKTRONIK (kategori_id = 5)
            ['kategori_sampah_id' => 5, 'nama_jenis' => 'Kabel Tembaga', 'harga_per_kg' => 25000, 'kode' => 'ELK-KBL'],
            ['kategori_sampah_id' => 5, 'nama_jenis' => 'PCB/Motherboard', 'harga_per_kg' => 15000, 'kode' => 'ELK-PCB'],
            ['kategori_sampah_id' => 5, 'nama_jenis' => 'Baterai', 'harga_per_kg' => 5000, 'kode' => 'ELK-BAT'],
            ['kategori_sampah_id' => 5, 'nama_jenis' => 'Komponen Elektronik', 'harga_per_kg' => 8000, 'kode' => 'ELK-KMP'],
        ];

        foreach ($jenisSampah as $jenis) {
            DB::table('jenis_sampah')->updateOrInsert(
                ['kode' => $jenis['kode']], // Unique key
                [
                    'kategori_sampah_id' => $jenis['kategori_sampah_id'],
                    'nama_jenis' => $jenis['nama_jenis'],
                    'harga_per_kg' => $jenis['harga_per_kg'],
                    'satuan' => 'kg',
                    'kode' => $jenis['kode'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        $this->command->info('✅ Seeded ' . count($jenisSampah) . ' jenis sampah');
    }
}
