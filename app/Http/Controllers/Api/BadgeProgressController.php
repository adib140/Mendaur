<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Badge;
use App\Models\BadgeProgress;
use App\Models\UserBadge;
use App\Services\BadgeTrackingService;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class BadgeProgressController extends Controller
{
    protected $badgeService;

    public function __construct(BadgeTrackingService $badgeService)
    {
        $this->badgeService = $badgeService;
    }

    // GET /api/user/badges/progress
    public function getUserProgress(Request $request)
    {
        try {
            $user = $request->user();

            $summary = $this->badgeService->getUserBadgeSummary($user);
            $details = $this->badgeService->getUserBadgeDetails($user);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'id' => $user->user_id,
                        'nama' => $user->nama,
                        'display_poin' => $user->display_poin, // Poin untuk leaderboard
                        'actual_poin' => $user->actual_poin,   // Poin yang bisa digunakan
                        'total_setor' => $user->total_setor_sampah,
                    ],
                    'summary' => $summary,
                    'completed_badges' => $details['completed_badges'],
                    'in_progress_badges' => $details['in_progress_badges'],
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/user/badges/completed
    public function getCompletedBadges(Request $request)
    {
        try {
            $user = $request->user();

            $badges = UserBadge::where('user_id', $user->id)
                ->with('badge')
                ->orderByDesc('tanggal_dapat')
                ->get()
                ->map(fn($ub) => [
                    'id' => $ub->id,
                    'badge_id' => $ub->badge_id,
                    'nama' => $ub->badge->nama,
                    'tipe' => $ub->badge->tipe,
                    'deskripsi' => $ub->badge->deskripsi,
                    'icon' => $ub->badge->icon ?? '🏆',
                    'reward_poin' => $ub->badge->reward_poin,
                    'earned_date' => $ub->tanggal_dapat?->format('Y-m-d H:i:s'),
                ]);

            return response()->json([
                'status' => 'success',
                'count' => $badges->count(),
                'data' => $badges
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/badges/leaderboard
    public function getLeaderboard(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            $limit = min($limit, 50); // Max 50

            // Filter only nasabah (role_id = 1), exclude admin and superadmin
            $leaderboard = User::query()
                ->select('user_id', 'nama', 'foto_profil', 'display_poin')
                ->where('role_id', 1)
                ->withCount('userBadges')
                ->orderByDesc('user_badges_count')
                ->orderByDesc('display_poin')
                ->limit($limit)
                ->get();

            $leaderboard = $leaderboard->map(function($user, $index) {
                $totalReward = UserBadge::where('user_id', $user->user_id)
                    ->join('badges', 'user_badges.badge_id', '=', 'badges.badge_id')
                    ->sum('badges.reward_poin') ?? 0;

                return [
                    'rank' => $index + 1,
                    'user' => [
                        'id' => $user->user_id,
                        'nama' => $user->nama,
                        'foto_profil' => $user->foto_profil,
                        'total_poin' => $user->display_poin,
                    ],
                    'badges_earned' => $user->user_badges_count,
                    'total_reward_poin' => $totalReward,
                ];
            });

            return response()->json([
                'status' => 'success',
                'period' => 'all_time',
                'updated_at' => now()->format('Y-m-d H:i:s'),
                'count' => $leaderboard->count(),
                'data' => $leaderboard
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/badges/analytics
    public function getAnalytics()
    {
        try {
            $totalBadges = Badge::count();
            $totalEarned = UserBadge::count();
            $totalUsers = User::count();
            $trackingUsers = BadgeProgress::distinct('user_id')->count('user_id');

            $mostEarned = Badge::withCount('userBadges')
                ->orderByDesc('user_badges_count')
                ->limit(5)
                ->get()
                ->map(fn($b) => [
                    'nama' => $b->nama,
                    'earned_count' => $b->user_badges_count,
                    'completion_rate' => round(($b->user_badges_count / $totalUsers) * 100, 2),
                ]);

            $rarest = Badge::withCount('userBadges')
                ->where('user_badges_count', '>', 0)
                ->orderBy('user_badges_count')
                ->limit(5)
                ->get()
                ->map(fn($b) => [
                    'nama' => $b->nama,
                    'earned_count' => $b->user_badges_count,
                    'rarity' => round(($b->user_badges_count / $totalUsers) * 100, 2),
                ]);

            $avgProgress = BadgeProgress::avg('progress_percentage') ?? 0;

            $byType = Badge::select('tipe')
                ->withCount('userBadges')
                ->groupBy('tipe')
                ->get()
                ->map(fn($b) => [
                    'tipe' => $b->tipe,
                    'total_earned' => $b->user_badges_count,
                ]);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_badges' => $totalBadges,
                    'total_earned' => $totalEarned,
                    'total_users' => $totalUsers,
                    'users_tracking' => $trackingUsers,
                    'average_badges_per_user' => round($totalUsers > 0 ? $totalEarned / $totalUsers : 0, 2),
                    'average_progress_percentage' => round($avgProgress, 2),
                    'most_earned_badges' => $mostEarned,
                    'rarest_badges' => $rarest,
                    'earned_by_type' => $byType,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/badges/available
    public function getAvailableBadges(Request $request)
    {
        try {
            $user = $request->user();

            $badges = Badge::all()->map(function($badge) use ($user) {
                $progress = BadgeProgress::where('user_id', $user->id)
                    ->where('badge_id', $badge->id)
                    ->first();

                $isCompleted = UserBadge::where('user_id', $user->id)
                    ->where('badge_id', $badge->id)
                    ->exists();

                return [
                    'id' => $badge->id,
                    'nama' => $badge->nama,
                    'deskripsi' => $badge->deskripsi,
                    'icon' => $badge->icon ?? '🏆',
                    'tipe' => $badge->tipe,
                    'syarat_poin' => $badge->syarat_poin,
                    'syarat_setor' => $badge->syarat_setor,
                    'reward_poin' => $badge->reward_poin,
                    'is_completed' => $isCompleted,
                    'progress' => $progress ? [
                        'current_value' => $progress->current_value,
                        'target_value' => $progress->target_value,
                        'progress_percentage' => round($progress->progress_percentage, 2),
                    ] : null,
                ];
            });

            return response()->json([
                'status' => 'success',
                'count' => $badges->count(),
                'data' => $badges
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
