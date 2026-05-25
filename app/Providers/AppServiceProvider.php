<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;
use Laravel\Sanctum\Sanctum;
use App\Models\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(Schedule $schedule): void
    {
        // Configure Sanctum to use our custom PersonalAccessToken model
        // with 'personal_access_token_id' as primary key instead of 'id'
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        // Badge Tracking: Recalculate all users' badge progress daily at 01:00 AM
        $schedule->command('badge:recalculate')->dailyAt('01:00');
    }
}
