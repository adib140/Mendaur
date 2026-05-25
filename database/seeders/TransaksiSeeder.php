<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\KategoriTransaksi;

class TransaksiSeeder extends Seeder
{
    public function run(): void
    {
        // Clear existing data
        DB::table('transaksis')->truncate();

        $user = User::first(); // ambil user pertama
        $kategori = KategoriTransaksi::first(); // ambil kategori pertama

        if ($user && $kategori) {
            DB::table('transaksis')->insert([
                [
                    'user_id' => $user->id,
                    'kategori_id' => $kategori->id,
                    'jumlah' => 12.5,
                    'deskripsi' => 'Penukaran poin awal',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'user_id' => $user->id,
                    'kategori_id' => $kategori->id,
                    'jumlah' => 7.0,
                    'deskripsi' => 'Bonus volume sampah',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }
}
