<?php

namespace App\Services;

use App\Models\User;
use App\Models\Badge;
use App\Models\Notifikasi;
use App\Models\LogAktivitas;
use App\Models\BadgeProgress;
use App\Services\PointService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BadgeService
{
    public function checkAndAwardBadges($userId)
    {
        $user = User::findOrFail($userId);

        // Sync badge progress first
        $badgeProgressService = new BadgeProgressService();
        $badgeProgressService->syncUserBadgeProgress($user);

        // Get all unlocked badges that haven't been awarded yet
        $unlockedProgress = BadgeProgress::with('badge')
            ->where('user_id', $userId)
            ->where('is_unlocked', true)
            ->whereDoesntHave('badge', function($query) use ($userId) {
                $query->whereHas('users', function($q) use ($userId) {
                    $q->where('user_id', $userId);
                });
            })
            ->get();

        $newlyUnlockedBadges = [];

        foreach ($unlockedProgress as $progress) {
            $badge = $progress->badge;

            // Award the badge
            $this->awardBadge($user, $badge);
            $newlyUnlockedBadges[] = $badge;
        }

        return $newlyUnlockedBadges;
    }

    private function checkBadgeRequirement(User $user, Badge $badge): bool
    {
        switch ($badge->tipe) {
            case 'poin':
                return $user->poin_tercatat >= $badge->syarat_poin;

            case 'setor':
                return $user->total_setor_sampah >= $badge->syarat_setor;

            case 'kombinasi':
                return ($user->poin_tercatat >= $badge->syarat_poin)
                    && ($user->total_setor_sampah >= $badge->syarat_setor);

            case 'special':
                // For special badges, implement custom logic
                return false;

            default:
                return false;
        }
    }

    private function awardBadge(User $user, Badge $badge): void
    {
        DB::transaction(function() use ($user, $badge) {
            // 1. Award the badge
            DB::table('user_badges')->insert([
                'user_id' => $user->id,
                'badge_id' => $badge->id,
                'tanggal_dapat' => now(),
                'reward_claimed' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Give bonus points (reward) based on nasabah type
            if ($badge->reward_poin > 0) {
                $notificationMessage = '';
                try {
                    // Use PointService to properly record transaction and update user poin
                    PointService::awardBonusPoints(
                        $user->user_id,
                        (int) $badge->reward_poin,
                        'badge_reward',
                        "Badge unlocked: {$badge->nama}",
                        $badge->badge_id,
                        'Badge'
                    );

                    $notificationMessage = $user->isNasabahKonvensional()
                        ? "Selamat! Kamu mendapatkan badge '{$badge->nama}' dan bonus {$badge->reward_poin} poin yang bisa digunakan!"
                        : "Selamat! Kamu mendapatkan badge '{$badge->nama}' dan bonus {$badge->reward_poin} poin (tercatat)!";

                } catch (\Exception $e) {
                    // Fallback: try direct increment to avoid losing reward if PointService fails
                    Log::error('Badge reward PointService failed, falling back to direct increment', [
                        'user_id' => $user->user_id,
                        'badge_id' => $badge->badge_id,
                        'error' => $e->getMessage(),
                    ]);

                    if ($user->isNasabahKonvensional()) {
                        $user->increment('actual_poin', $badge->reward_poin);
                        $user->increment('display_poin', $badge->reward_poin);
                        $notificationMessage = "Selamat! Kamu mendapatkan badge '{$badge->nama}' dan bonus {$badge->reward_poin} poin yang bisa digunakan!";
                    } else {
                        $user->increment('poin_tercatat', $badge->reward_poin);
                        $notificationMessage = "Selamat! Kamu mendapatkan badge '{$badge->nama}' dan bonus {$badge->reward_poin} poin (tercatat)!";
                    }
                }

                // 3. Log the activity
                LogAktivitas::log(
                    $user->id,
                    LogAktivitas::TYPE_BADGE_UNLOCK,
                    "Mendapatkan badge '{$badge->nama}' dan bonus {$badge->reward_poin} poin",
                    $badge->reward_poin
                );

                // 4. Create notification
                Notifikasi::create([
                    'user_id' => $user->id,
                    'judul' => '🎉 Badge Baru!',
                    'pesan' => $notificationMessage,
                    'tipe' => 'badge',
                    'dibaca' => false,
                ]);
            }
        });
    }

    public function getAllBadges()
    {
        return Badge::orderBy('syarat_poin')->orderBy('syarat_setor')->get();
    }

    public function getUserBadgeProgress($userId)
    {
        $user = User::findOrFail($userId);
        $allBadges = Badge::all();
        $userBadges = DB::table('user_badges')
            ->where('user_id', $userId)
            ->pluck('badge_id')
            ->toArray();

        return $allBadges->map(function($badge) use ($user, $userBadges) {
            $unlocked = in_array($badge->id, $userBadges);
            $progress = 0;

            if (!$unlocked) {
                if ($badge->syarat_poin > 0) {
                    $progress = min(100, ($user->poin_tercatat / $badge->syarat_poin) * 100);
                } elseif ($badge->syarat_setor > 0) {
                    $progress = min(100, ($user->total_setor_sampah / $badge->syarat_setor) * 100);
                }
            } else {
                $progress = 100;
            }

            return [
                'badge' => $badge,
                'unlocked' => $unlocked,
                'progress' => round($progress, 2),
            ];
        });
    }
}
