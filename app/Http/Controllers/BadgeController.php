<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BadgeService;
use App\Services\BadgeProgressService;
use App\Models\Badge;
use App\Models\User;
use App\Http\Resources\BadgeResource;

class BadgeController extends Controller
{
    protected $badgeService;

    public function __construct(BadgeService $badgeService)
    {
        $this->badgeService = $badgeService;
    }

    // GET /api/badges
    public function index()
    {
        $badges = $this->badgeService->getAllBadges();

        return response()->json([
            'status' => 'success',
            'data' => BadgeResource::collection($badges),
        ]);
    }

    // GET /api/badges/user/{userId}/progress
    public function getUserProgress($userId)
    {
        $progress = $this->badgeService->getUserBadgeProgress($userId);

        return response()->json([
            'status' => 'success',
            'data' => collect($progress)->map(function($item) {
                return [
                    'badge_id' => $item['badge_id'],
                    'nama' => $item['nama'],
                    'deskripsi' => $item['deskripsi'],
                    'icon' => $item['icon'],
                    'reward_poin' => $item['reward_poin'],
                    'tipe' => $item['tipe'],
                    'syarat_poin' => $item['syarat_poin'],
                    'syarat_setor' => $item['syarat_setor'],
                    'current_value' => $item['current_value'],
                    'target_value' => $item['target_value'],
                    'progress_percentage' => $item['progress_percentage'],
                    'is_unlocked' => $item['is_unlocked'],
                    'unlocked_at' => $item['unlocked_at'],
                ];
            }),
        ]);
    }

    // GET /api/badges/user/{userId}?filter=all|unlocked|locked
    public function getUserBadges(Request $request, $userId = null)
    {
        try {
            $request->validate([
                'filter' => 'sometimes|in:all,unlocked,locked',
            ]);

            $filter = $request->input('filter', 'all');

            // Get user
            $user = $userId
                ? User::findOrFail($userId)
                : $request->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Use the new BadgeProgressService
            $badgeProgressService = new BadgeProgressService();
            $result = $badgeProgressService->getUserBadgeProgress($user, $filter);

            return response()->json([
                'status' => 'success',
                'data' => $result['data']->map(function($progress) {
                    return [
                        'badge_id' => $progress->badge->badge_id,
                        'nama' => $progress->badge->nama,
                        'deskripsi' => $progress->badge->deskripsi,
                        'icon' => $progress->badge->icon,
                        'reward_poin' => $progress->badge->reward_poin,
                        'tipe' => $progress->badge->tipe,
                        'syarat_poin' => $progress->badge->syarat_poin,
                        'syarat_setor' => $progress->badge->syarat_setor,
                        'current_value' => $progress->current_value,
                        'target_value' => $progress->target_value,
                        'progress_percentage' => $progress->progress_percentage,
                        'is_unlocked' => $progress->is_unlocked,
                        'unlocked_at' => $progress->unlocked_at,
                    ];
                }),
                'counts' => $result['counts'],
                'message' => $result['message'],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // POST /api/badges/user/{userId}/check
    public function checkBadges($userId)
    {
        $newBadges = $this->badgeService->checkAndAwardBadges($userId);

        return response()->json([
            'status' => 'success',
            'message' => count($newBadges) > 0
                ? 'Badge(s) baru diberikan!'
                : 'Tidak ada badge baru.',
            'data' => [
                'newly_unlocked' => BadgeResource::collection($newBadges),
                'count' => count($newBadges),
            ],
        ]);
    }
}
