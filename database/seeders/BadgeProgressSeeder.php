<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Services\BadgeProgressService;

class BadgeProgressSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // TEMPORARILY DISABLED - Will be fixed after migration
        // The badge progress seeder will be run separately
        // $progressService = new BadgeProgressService();
        //
        // echo "\n🔄 Initializing badge progress for all users...\n";
        //
        // // Initialize progress for all users
        // $users = User::all();
        // $totalUsers = $users->count();
        // $current = 0;
        //
        // foreach ($users as $user) {
        //     $current++;
        //     echo "  [{$current}/{$totalUsers}] Processing {$user->nama}...\n";
        //
        //     $progressService->syncUserBadgeProgress($user);
        // }
        //
        // echo "\n✅ Badge progress initialized for all {$totalUsers} users!\n\n";

        echo "\n⏭️  Badge progress seeder skipped (will be run separately)\n\n";
    }
}
