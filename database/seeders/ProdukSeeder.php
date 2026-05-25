<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProdukSeeder extends Seeder
{
    public function run(): void
    {
        $produkList = [
            [
                'nama' => 'Tas Belanja Ramah Lingkungan',
                'deskripsi' => 'Tas belanja terbuat dari bahan daur ulang',
                'harga_poin' => 50,
                'stok' => 100,
                'kategori' => 'Tas',
                'foto' => 'produk/tas-belanja.jpg',
                'status' => 'tersedia',
            ],
            [
                'nama' => 'Botol Minum Stainless',
                'deskripsi' => 'Botol minum 500ml stainless steel',
                'harga_poin' => 100,
                'stok' => 50,
                'kategori' => 'Botol',
                'foto' => 'produk/botol-stainless.jpg',
                'status' => 'tersedia',
            ],
            [
                'nama' => 'Pupuk Kompos Organik 1kg',
                'deskripsi' => 'Pupuk kompos hasil pengolahan sampah organik',
                'harga_poin' => 30,
                'stok' => 200,
                'kategori' => 'Pupuk',
                'foto' => 'produk/pupuk-kompos.jpg',
                'status' => 'tersedia',
            ],
            [
                'nama' => 'Sedotan Stainless (Set 4)',
                'deskripsi' => 'Set sedotan stainless dengan sikat pembersih',
                'harga_poin' => 40,
                'stok' => 150,
                'kategori' => 'Sedotan',
                'foto' => 'produk/sedotan-stainless.jpg',
                'status' => 'tersedia',
            ],
            [
                'nama' => 'Voucher Pulsa 50K',
                'deskripsi' => 'Voucher pulsa senilai Rp 50.000',
                'harga_poin' => 500,
                'stok' => 0,
                'kategori' => 'Voucher',
                'foto' => 'produk/voucher-pulsa.jpg',
                'status' => 'habis',
            ],
        ];

        foreach ($produkList as $produk) {
            DB::table('produks')->updateOrInsert(
                ['nama' => $produk['nama']], // Unique key
                array_merge($produk, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
