<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TabungSampah;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminDashboardController extends Controller
{
    // GET /api/admin/dashboard/overview
    public function overview()
    {
        try {
            // Get users count (exclude soft-deleted)
            $totalUsers = DB::table('users')
                ->where('deleted_at', null)
                ->count();

            // Get active users (with recent activity, exclude soft-deleted)
            $activeUsers = DB::table('users')
                ->where('deleted_at', null)
                ->where('updated_at', '>=', Carbon::now()->subDays(30))
                ->count();

            // Check if TabungSampah table exists
            $hasSampahTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'tabung_sampah']);

            $totalWasteCollected = 0;
            if (!empty($hasSampahTable)) {
                $totalWasteCollected = DB::table('tabung_sampah')->sum('berat_kg') ?? 0;
            }

            // Check if poin_transaksis table exists
            $hasPoinTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'poin_transaksis']);

            $totalPointsDistributed = 0;
            if (!empty($hasPoinTable)) {
                $totalPointsDistributed = DB::table('poin_transaksis')->sum('poin_didapat') ?? 0;
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'totalUsers' => $totalUsers,
                    'activeUsers' => $activeUsers,
                    'totalWasteCollected' => (float) $totalWasteCollected,
                    'totalPointsDistributed' => (int) $totalPointsDistributed,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch dashboard overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/dashboard/stats
    public function stats()
    {
        try {
            $now = Carbon::now();
            $thisMonth = $now->copy()->startOfMonth();
            $lastMonth = $now->copy()->subMonth()->startOfMonth();
            $thisMonthEnd = $now->copy()->endOfMonth();
            $lastMonthEnd = $lastMonth->copy()->endOfMonth();

            // Check if tables exist
            $hasSampahTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'tabung_sampah']);
            $hasPoinTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'poin_transaksis']);

            // Initialize default values
            $thisMonthWaste = 0;
            $thisMonthUsers = DB::table('users')
                ->where('deleted_at', null)
                ->whereBetween('created_at', [$thisMonth, $thisMonthEnd])
                ->count();
            $thisMonthPoints = 0;
            $lastMonthWaste = 0;
            $topCategories = [];

            // Get waste data if table exists
            if (!empty($hasSampahTable)) {
                $thisMonthWaste = DB::table('tabung_sampah')
                    ->whereBetween('created_at', [$thisMonth, $thisMonthEnd])
                    ->sum('berat_kg') ?? 0;

                $lastMonthWaste = DB::table('tabung_sampah')
                    ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
                    ->sum('berat_kg') ?? 0;

                // Top categories
                $categories = DB::table('tabung_sampah')
                    ->whereBetween('created_at', [$thisMonth, $thisMonthEnd])
                    ->select('jenis_sampah', DB::raw('SUM(berat_kg) as total'))
                    ->groupBy('jenis_sampah')
                    ->orderByDesc('total')
                    ->limit(5)
                    ->get();

                $topCategories = $categories->map(function ($cat) use ($thisMonthWaste) {
                    return [
                        'category' => $cat->jenis_sampah,
                        'quantity' => (float) $cat->total,
                        'percentage' => $thisMonthWaste > 0 ? round(($cat->total / $thisMonthWaste * 100), 2) : 0,
                    ];
                })->toArray();
            }

            // Get points data if table exists
            if (!empty($hasPoinTable)) {
                $thisMonthPoints = DB::table('poin_transaksis')
                    ->whereBetween('created_at', [$thisMonth, $thisMonthEnd])
                    ->sum('poin_didapat') ?? 0;
            }

            // Calculate growth
            $wasteGrowth = $lastMonthWaste > 0 ? (($thisMonthWaste - $lastMonthWaste) / $lastMonthWaste * 100) : 0;

            return response()->json([
                'status' => 'success',
                'data' => [
                    'thisMonth' => [
                        'waste' => (float) $thisMonthWaste,
                        'newUsers' => $thisMonthUsers,
                        'points' => (int) $thisMonthPoints,
                    ],
                    'lastMonth' => [
                        'waste' => (float) $lastMonthWaste,
                    ],
                    'growth' => [
                        'wastePercentage' => (float) round($wasteGrowth, 2),
                    ],
                    'topCategories' => $topCategories,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
