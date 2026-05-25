<?php

namespace Database\Seeders;

use App\Models\PoinCorrection;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class PoinCorrectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $nasabahUsers = User::where('role_id', 1)->take(10)->get();
        $superadminUsers = User::where('role_id', '>=', 3)->get();

        if ($nasabahUsers->isEmpty() || $superadminUsers->isEmpty()) {
            $this->command->info('⚠️  Users tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        $types = ['correction', 'reversal', 'fraud_prevention', 'system_fix'];
        $statuses = ['approved', 'pending_review'];
        $totalKoreksi = 0;

        foreach ($nasabahUsers as $user) {
            // Setiap user memiliki 0-3 koreksi poin
            for ($i = 0; $i < rand(0, 3); $i++) {
                $oldValue = rand(100, 5000);
                $difference = rand(-1000, 1000);
                $newValue = $oldValue + $difference;
                $tanggalKoreksi = Carbon::now()->subDays(rand(1, 60));

                PoinCorrection::create([
                    'superadmin_id' => $superadminUsers->random()->user_id,
                    'nasabah_id' => $user->user_id,
                    'old_value' => $oldValue,
                    'new_value' => $newValue,
                    'difference' => $difference,
                    'type' => $types[array_rand($types)],
                    'reason' => $this->getRandomReason(),
                    'notes' => rand(0, 1) ? 'Sudah dikonfirmasi dengan user' : null,
                    'status' => $statuses[array_rand($statuses)],
                    'is_reversed' => false,
                    'reversed_by' => null,
                    'reversed_at' => null,
                    'created_at' => $tanggalKoreksi,
                    'updated_at' => $tanggalKoreksi,
                ]);

                $totalKoreksi++;
            }
        }

        $this->command->info("✅ PoinCorrection seeder berhasil dijalankan (Total: {$totalKoreksi} koreksi)");
    }

    private function getRandomReason(): string
    {
        $reasons = [
            'Koreksi poin yang dihitung kurang',
            'Pemberian bonus poin sebagai kompensasi',
            'Penyesuaian karena data error',
            'Koreksi atas komplain user',
            'Pemberian insentif bulanan',
            'Kesalahan sistem saat approval',
        ];

        return $reasons[array_rand($reasons)];
    }
}
