<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KategoriSampahSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'kategori_sampah_id' => 1,
                'nama_kategori' => 'Plastik',
                'deskripsi' => 'Berbagai jenis sampah plastik yang dapat didaur ulang',
                'icon' => '♻️',
                'warna' => '#2196F3',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 2,
                'nama_kategori' => 'Kertas',
                'deskripsi' => 'Sampah kertas dan turunannya',
                'icon' => '📄',
                'warna' => '#8B4513',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 3,
                'nama_kategori' => 'Logam',
                'deskripsi' => 'Sampah logam dan komponen metal',
                'icon' => '🔩',
                'warna' => '#A9A9A9',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 4,
                'nama_kategori' => 'Kaca',
                'deskripsi' => 'Sampah kaca dan material kaca',
                'icon' => '🍾',
                'warna' => '#00BCD4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 5,
                'nama_kategori' => 'Elektronik',
                'deskripsi' => 'Sampah elektronik dan komponen elektronik',
                'icon' => '🔌',
                'warna' => '#FF9800',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 6,
                'nama_kategori' => 'Tekstil',
                'deskripsi' => 'Sampah tekstil dan bahan pakaian',
                'icon' => '👕',
                'warna' => '#E91E63',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 7,
                'nama_kategori' => 'Pecah Belah',
                'deskripsi' => 'Barang pecah belah dan item yang rusak',
                'icon' => '🪟',
                'warna' => '#00BCD4',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'kategori_sampah_id' => 8,
                'nama_kategori' => 'Lainnya',
                'deskripsi' => 'Sampah campuran dan kategori lainnya',
                'icon' => '🗑️',
                'warna' => '#607D8B',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($categories as $category) {
            DB::table('kategori_sampah')->updateOrInsert(
                ['nama_kategori' => $category['nama_kategori']],
                $category
            );
        }
    }
}
