<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

// Badge tracking events and listeners
use App\Events\TabungSampahCreated;
use App\Events\PoinTransaksiCreated;
use App\Listeners\UpdateBadgeProgressOnTabungSampah;
use App\Listeners\UpdateBadgeProgressOnPoinChange;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],

        // Badge Tracking System Events
        TabungSampahCreated::class => [
            UpdateBadgeProgressOnTabungSampah::class,
        ],

        PoinTransaksiCreated::class => [
            UpdateBadgeProgressOnPoinChange::class,
        ],
    ];

    public function boot(): void
    {
        //
    }

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
