<?php

namespace Database\Seeders;

use App\Models\UserBadge;
use App\Models\User;
use App\Models\Badge;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class UserBadgeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil users dan badges
        $users = User::where('role_id', 1)->take(15)->get();
        $badges = Badge::all();

        if ($users->isEmpty() || $badges->isEmpty()) {
            $this->command->info('⚠️  Users atau Badges tidak ditemukan. Silakan jalankan seeder yang sesuai terlebih dahulu.');
            return;
        }

        // Berikan badges ke users secara random
        foreach ($users as $user) {
            // Setiap user bisa memiliki 1-3 badges
            $randomBadges = $badges->random(rand(1, 3));

            foreach ($randomBadges as $badge) {
                // Cek apakah user sudah memiliki badge ini
                $exists = UserBadge::where('user_id', $user->user_id)
                    ->where('badge_id', $badge->badge_id)
                    ->exists();

                if (!$exists) {
                    UserBadge::create([
                        'user_id' => $user->user_id,
                        'badge_id' => $badge->badge_id,
                        'tanggal_dapat' => Carbon::now()->subDays(rand(1, 60)),
                    ]);
                }
            }
        }

        $this->command->info('✅ UserBadge seeder berhasil dijalankan');
    }
}
