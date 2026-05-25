<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\UserBadge;

class BadgeProgress extends Model
{
    protected $table = 'badge_progress';
    protected $primaryKey = 'badge_progress_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'badge_id',
        'current_value',
        'target_value',
        'progress_percentage',
        'is_unlocked',
        'unlocked_at',
    ];

    protected $casts = [
        'progress_percentage' => 'decimal:2',
        'is_unlocked' => 'boolean',
        'unlocked_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function badge(): BelongsTo
    {
        return $this->belongsTo(Badge::class, 'badge_id', 'badge_id');
    }

    public function updateProgress(User $user): void
    {
        $badge = $this->badge;

        // Determine current value based on badge type (ensure not NULL)
        // Use display_poin for poin-based badges (the correct column name)
        $currentValue = match($badge->tipe) {
            'poin' => $user->display_poin ?? 0,
            'setor' => $user->total_setor_sampah ?? 0,
            'kombinasi' => min($user->display_poin ?? 0, $user->total_setor_sampah ?? 0),
            'ranking' => $this->calculateRankingProgress($user),
            default => 0,
        };

        // Determine target value
        $targetValue = match($badge->tipe) {
            'poin' => $badge->syarat_poin ?? 0,
            'setor' => $badge->syarat_setor ?? 0,
            'kombinasi' => max($badge->syarat_poin ?? 0, $badge->syarat_setor ?? 0),
            'ranking' => $badge->syarat_poin ?? 0, // Use syarat_poin for rank requirement
            default => 0,
        };

        // Calculate percentage
        if ($badge->tipe === 'ranking') {
            // For ranking badges: unlocked if current rank <= target rank
            // current_value = user's rank (1 = best)
            // target_value = required rank (e.g., 10 for "Top 10")
            $isUnlocked = $currentValue > 0 && $currentValue <= $targetValue;
            $percentage = $isUnlocked ? 100 : 0;
        } else {
            // For other badges: standard percentage calculation
            $percentage = $targetValue > 0 ? min(($currentValue / $targetValue) * 100, 100) : 0;
            $isUnlocked = $percentage >= 100;
        }

        // Track if badge was already unlocked before this update
        $wasUnlockedBefore = $this->is_unlocked;

        $this->update([
            'current_value' => $currentValue,
            'target_value' => $targetValue,
            'progress_percentage' => round($percentage, 2),
            'is_unlocked' => $isUnlocked,
            'unlocked_at' => $isUnlocked && !$this->unlocked_at ? now() : $this->unlocked_at,
        ]);

        // If badge just got unlocked (wasn't unlocked before), sync to user_badges
        if ($isUnlocked && !$wasUnlockedBefore) {
            $this->syncToUserBadges();
        }
    }

    private function syncToUserBadges(): void
    {
        UserBadge::firstOrCreate(
            [
                'user_id' => $this->user_id,
                'badge_id' => $this->badge_id,
            ],
            [
                'tanggal_dapat' => $this->unlocked_at ?? now(),
                'reward_claimed' => false,
            ]
        );
    }

    private function calculateRankingProgress(User $user): int
    {
        // Get user's rank (1-indexed) based on display_poin
        $rank = User::where('display_poin', '>', $user->display_poin ?? 0)->count() + 1;
        return $rank;
    }
}
