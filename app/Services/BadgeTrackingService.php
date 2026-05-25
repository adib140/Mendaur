<?php

namespace App\Services;

use App\Models\User;
use App\Models\Badge;
use App\Models\BadgeProgress;
use App\Models\UserBadge;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * BadgeTrackingService
 *
 * Service for tracking badge progress and managing user badges
 */
class BadgeTrackingService
{
    /**
     * Update user's badge progress for a specific activity
     */
    public function updateUserBadgeProgress(User $user, string $activityType = null): void
    {
        try {
            // Refresh user data to get latest stats
            $user->refresh();

            // Get all active badges
            $badges = Badge::all();

            foreach ($badges as $badge) {
                $this->checkAndUpdateBadgeProgress($user, $badge);
            }

        } catch (\Exception $e) {
            Log::error("Error updating badge progress for user {$user->user_id}: " . $e->getMessage());
        }
    }

    /**
     * Check and update progress for a specific badge
     */
    private function checkAndUpdateBadgeProgress(User $user, Badge $badge): void
    {
        // Get or create badge progress record
        $progress = BadgeProgress::firstOrCreate(
            [
                'user_id' => $user->user_id,
                'badge_id' => $badge->badge_id,
            ],
            [
                'current_value' => 0,
                'target_value' => $this->getTargetValue($badge),
                'progress_percentage' => 0,
                'is_unlocked' => false,
            ]
        );

        // Update current value based on badge type
        $currentValue = $this->getCurrentValueForBadge($user, $badge);
        $targetValue = $this->getTargetValue($badge);

        // Calculate progress percentage
        $percentage = $targetValue > 0 ? min(100, ($currentValue / $targetValue) * 100) : 0;

        // Check if badge should be unlocked
        $shouldUnlock = ($currentValue >= $targetValue) && !$progress->is_unlocked;

        // Update progress
        $progress->current_value = $currentValue;
        $progress->target_value = $targetValue;
        $progress->progress_percentage = round($percentage, 2);

        if ($shouldUnlock) {
            $progress->is_unlocked = true;
            $progress->unlocked_at = now();

            // Award the badge
            $this->awardBadgeToUser($user, $badge);
        }

        $progress->save();
    }

    /**
     * Get current value for badge based on user's stats
     */
    private function getCurrentValueForBadge(User $user, Badge $badge): int
    {
        return match($badge->tipe) {
            'poin' => $user->display_poin ?? 0,
            'setor' => $user->total_setor_sampah ?? 0,
            'kombinasi' => min($user->display_poin ?? 0, $user->total_setor_sampah ?? 0),
            'ranking' => $user->display_poin ?? 0,
            default => 0,
        };
    }

    /**
     * Get target value for badge completion
     */
    private function getTargetValue(Badge $badge): int
    {
        return match($badge->tipe) {
            'poin' => $badge->syarat_poin ?? 0,
            'setor' => $badge->syarat_setor ?? 0,
            'kombinasi' => max($badge->syarat_poin ?? 0, $badge->syarat_setor ?? 0),
            'ranking' => $badge->syarat_poin ?? 0,
            default => 0,
        };
    }

    /**
     * Award badge to user
     */
    private function awardBadgeToUser(User $user, Badge $badge): void
    {
        // Check if user already has this badge
        $existingBadge = UserBadge::where('user_id', $user->user_id)
            ->where('badge_id', $badge->badge_id)
            ->first();

        if (!$existingBadge) {
            // Create user badge record
            UserBadge::create([
                'user_id' => $user->user_id,
                'badge_id' => $badge->badge_id,
                'tanggal_diperoleh' => now(),
            ]);

            // Award bonus points using BadgeService
            if ($badge->bonus_poin > 0) {
                app(BadgeService::class)->awardBonusPoints($user, $badge);
            }

            Log::info("Badge '{$badge->nama}' awarded to user {$user->user_id}");
        }
    }

    /**
     * Get user badge summary (for dashboard)
     */
    public function getUserBadgeSummary(User $user): array
    {
        $totalBadges = Badge::count();
        $earnedBadges = UserBadge::where('user_id', $user->user_id)->count();
        $inProgress = BadgeProgress::where('user_id', $user->user_id)
            ->where('is_unlocked', false)
            ->where('progress_percentage', '>', 0)
            ->count();

        return [
            'total_badges' => $totalBadges,
            'earned_badges' => $earnedBadges,
            'in_progress' => $inProgress,
            'completion_rate' => $totalBadges > 0 ? round(($earnedBadges / $totalBadges) * 100, 2) : 0,
        ];
    }

    /**
     * Get detailed badge information for user
     */
    public function getUserBadgeDetails(User $user): array
    {
        // Get completed badges
        $completedBadges = UserBadge::with('badge')
            ->where('user_id', $user->user_id)
            ->get()
            ->map(function ($userBadge) {
                return [
                    'badge_id' => $userBadge->badge->badge_id,
                    'nama' => $userBadge->badge->nama,
                    'deskripsi' => $userBadge->badge->deskripsi,
                    'icon' => $userBadge->badge->icon,
                    'tipe' => $userBadge->badge->tipe,
                    'bonus_poin' => $userBadge->badge->bonus_poin,
                    'tanggal_diperoleh' => $userBadge->tanggal_diperoleh,
                    'is_completed' => true,
                    'progress_percentage' => 100,
                ];
            });

        // Get in-progress badges
        $inProgressBadges = BadgeProgress::with('badge')
            ->where('user_id', $user->user_id)
            ->where('is_unlocked', false)
            ->get()
            ->map(function ($progress) {
                return [
                    'badge_id' => $progress->badge->badge_id,
                    'nama' => $progress->badge->nama,
                    'deskripsi' => $progress->badge->deskripsi,
                    'icon' => $progress->badge->icon,
                    'tipe' => $progress->badge->tipe,
                    'bonus_poin' => $progress->badge->bonus_poin,
                    'current_value' => $progress->current_value,
                    'target_value' => $progress->target_value,
                    'progress_percentage' => $progress->progress_percentage,
                    'is_completed' => false,
                ];
            });

        return [
            'completed_badges' => $completedBadges,
            'in_progress_badges' => $inProgressBadges,
        ];
    }

    /**
     * Sync all badge progress for a user
     * (Useful for recalculation or initialization)
     */
    public function syncAllBadgeProgress(User $user): void
    {
        $badges = Badge::all();

        foreach ($badges as $badge) {
            $this->checkAndUpdateBadgeProgress($user, $badge);
        }
    }

    /**
     * Get all users who should unlock a specific badge
     */
    public function getUsersEligibleForBadge(Badge $badge): array
    {
        $targetValue = $this->getTargetValue($badge);

        $query = User::query();

        switch ($badge->tipe) {
            case 'poin':
                $query->where('display_poin', '>=', $targetValue);
                break;
            case 'setor':
                $query->where('total_setor_sampah', '>=', $targetValue);
                break;
            case 'kombinasi':
                $query->where('display_poin', '>=', $badge->syarat_poin ?? 0)
                      ->where('total_setor_sampah', '>=', $badge->syarat_setor ?? 0);
                break;
        }

        // Only users who don't have the badge yet
        $query->whereDoesntHave('userBadges', function ($q) use ($badge) {
            $q->where('badge_id', $badge->badge_id);
        });

        return $query->get()->toArray();
    }
}
