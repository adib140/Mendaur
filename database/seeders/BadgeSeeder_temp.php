<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        DB::table('users')->truncate();

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        DB::table('users')->insert([
            [
                'nama' => 'Adib Surya',
                'email' => 'adib@example.com',
                'password' => Hash::make('password'),
                'no_hp' => '081234567890',
                'alamat' => 'Jl. Gatot Subroto No. 123, Metro Barat',
                'foto_profil' => null,
                'total_poin' => 150,
                'total_setor_sampah' => 5,
                'level' => 'Bronze',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Siti Aminah',
                'email' => 'siti@example.com',
                'password' => Hash::make('password'),
                'no_hp' => '082345678901',
                'alamat' => 'Jl. Diponegoro No. 456, Metro Timur',
                'foto_profil' => null,
                'total_poin' => 300,
                'total_setor_sampah' => 12,
                'level' => 'Silver',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama' => 'Budi Santoso',
                'email' => 'budi@example.com',
                'password' => Hash::make('password'),
                'no_hp' => '083456789012',
                'alamat' => 'Jl. Sudirman No. 789, Metro Selatan',
                'foto_profil' => null,
                'total_poin' => 50,
                'total_setor_sampah' => 2,
                'level' => 'Pemula',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
