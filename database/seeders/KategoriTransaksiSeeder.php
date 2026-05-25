<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KategoriTransaksiSeeder extends Seeder
{
    public function run(): void
    {
        $kategoriList = [
            [
                'nama' => 'Penukaran Poin',
                'deskripsi' => 'Transaksi penukaran poin dengan produk',
            ],
            [
                'nama' => 'Penyetoran Sampah',
                'deskripsi' => 'Transaksi penerimaan poin dari setor sampah',
            ],
            [
                'nama' => 'Bonus Reward',
                'deskripsi' => 'Poin bonus dari program reward',
            ],
        ];

        foreach ($kategoriList as $kategori) {
            DB::table('kategori_transaksi')->updateOrInsert(
                ['nama' => $kategori['nama']], // Unique key
                [
                    'nama' => $kategori['nama'],
                    'deskripsi' => $kategori['deskripsi'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
