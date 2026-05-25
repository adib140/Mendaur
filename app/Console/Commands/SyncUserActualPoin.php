<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SyncUserActualPoin extends Command
{
    protected $signature = 'user:sync-actual-poin {--force : Force sync all users}';

    protected $description = 'Sync actual_poin field from poin_transaksis data';

    public function handle()
    {
        $this->info('🔄 Syncing actual_poin from poin_transaksis...');

        // Get all users with transaction data
        $users = User::whereHas('poinTransaksis')->get();

        $bar = $this->output->createProgressBar($users->count());
        $updated = 0;

        foreach ($users as $user) {
            // Calculate actual poin from transactions
            $actualPoin = $user->getAvailablePoin();

            // Update if different or force option is used
            if ($user->actual_poin !== $actualPoin || $this->option('force')) {
                $oldValue = $user->actual_poin;
                $user->actual_poin = $actualPoin;
                $user->save();
                $updated++;

                if ($this->option('verbose')) {
                    $this->line("\n📝 {$user->nama}: {$oldValue} → {$actualPoin}");
                }
            }

            $bar->advance();
        }

        $bar->finish();

        $this->newLine();
        $this->info("✅ Updated {$updated} users");

        // Show summary
        $this->table(
            ['Field', 'Description'],
            [
                ['display_poin', 'For leaderboard ranking (can be reset)'],
                ['actual_poin', 'For transactions/withdrawals (from poin_transaksis)'],
                ['Available Poin', 'Calculated real-time from poin_transaksis']
            ]
        );

        return Command::SUCCESS;
    }
}
