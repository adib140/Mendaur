<?php

namespace App\Listeners;

use App\Services\BadgeTrackingService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class UpdateBadgeProgressOnTabungSampah implements ShouldQueue
{
    use InteractsWithQueue;

    protected $badgeService;

    public function __construct(BadgeTrackingService $badgeService)
    {
        $this->badgeService = $badgeService;
    }

    // Handle event - triggered when tabung_sampah is created
    public function handle($event)
    {
        // Get the user from the tabung_sampah
        $user = $event->tabungSampah->user;

        // Refresh user to get latest totals
        $user->refresh();

        // Update badge progress for this user
        $this->badgeService->updateUserBadgeProgress($user, 'setor_sampah');
    }
}
