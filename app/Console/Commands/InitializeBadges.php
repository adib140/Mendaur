<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\BadgeTrackingService;

class InitializeBadges extends Command
{
    protected $signature = 'badge:initialize {--force}';

    protected $description = 'Initialize badges for all existing users (create badge_progress records)';

    public function __construct(private BadgeTrackingService $badgeService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        // Ask for confirmation
        if (!$this->option('force')) {
            if (!$this->confirm('This will initialize badges for all existing users. Continue?')) {
                $this->info('Command cancelled.');
                return 0;
            }
        }

        try {
            $this->info('Initializing badges for all users...');
            $this->newLine();

            // Get all users
            $users = User::all();
            $totalUsers = $users->count();

            if ($totalUsers === 0) {
                $this->warn('No users found in database.');
                return 0;
            }

            $this->info("Found {$totalUsers} users to initialize.");
            $this->newLine();

            // Progress bar
            $progressBar = $this->output->createProgressBar($totalUsers);
            $progressBar->start();

            $successCount = 0;
            $errorCount = 0;

            foreach ($users as $user) {
                try {
                    $this->badgeService->initializeUserBadges($user);
                    $successCount++;
                } catch (\Exception $e) {
                    $errorCount++;
                    $this->error("Error initializing badges for user {$user->id}: {$e->getMessage()}");
                }
                $progressBar->advance();
            }

            $progressBar->finish();
            $this->newLine(2);

            // Summary
            $this->info('✅ Badge Initialization Complete!');
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            $this->line("Total Users: <fg=cyan>{$totalUsers}</>");
            $this->line("Successful: <fg=green>{$successCount}</>");
            if ($errorCount > 0) {
                $this->line("Errors: <fg=red>{$errorCount}</>");
            }
            $this->line("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // Verification
            $this->newLine();
            $this->info('Verifying initialization...');

            // Check if badge_progress records were created
            $progressCount = \App\Models\BadgeProgress::distinct('user_id')->count();
            $badgesCount = \App\Models\Badge::count();

            $this->line("Badge Progress Records: <fg=cyan>{$progressCount}</> users");
            $this->line("Total Badges: <fg=cyan>{$badgesCount}</>");

            if ($progressCount === $successCount && $badgesCount > 0) {
                $this->info('✅ Initialization verified successfully!');
                return 0;
            } else {
                $this->warn('⚠️  Please verify the results manually.');
                return 0;
            }

        } catch (\Exception $e) {
            $this->error("Fatal error: {$e->getMessage()}");
            \Log::error('Badge initialization error: ' . $e->getMessage(), ['exception' => $e]);
            return 1;
        }
    }
}
