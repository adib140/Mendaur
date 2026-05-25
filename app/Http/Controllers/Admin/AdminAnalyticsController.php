<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TabungSampah;
use App\Models\User;
use App\Models\PoinTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class AdminAnalyticsController extends Controller
{
    // GET /api/admin/analytics/waste
    public function waste(Request $request)
    {
        try {
            $period = $request->query('period', 'monthly');
            $year = $request->query('year', Carbon::now()->year);
            $month = $request->query('month', null);
            $category = $request->query('category', null);

            $cacheKey = "waste_analytics_{$period}_{$year}_{$month}_{$category}";

            $data = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($period, $year, $month, $category) {
                return $this->executeWasteAnalytics($period, $year, $month, $category);
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch waste analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Execute waste analytics
    private function executeWasteAnalytics($period, $year, $month, $category)
    {
        // Status 'approved' for accepted waste deposits
        $approvedStatus = 'approved';
        $pendingStatus = 'menunggu';

        $query = DB::table('tabung_sampah')
            ->where('status', $approvedStatus)
            ->whereYear('created_at', $year);

        if ($month) {
            $query->whereMonth('created_at', $month);
        }

        if ($category) {
            $query->where('jenis_sampah', $category);
        }

        $stats = $query->selectRaw('
            COALESCE(SUM(berat_kg), 0) as total_weight,
            COUNT(*) as total_transactions,
            COALESCE(AVG(berat_kg), 0) as average_per_transaction
        ')->first();

        $totalWaste = (float) $stats->total_weight;
        $totalTransactions = (int) $stats->total_transactions;
        $averagePerTransaction = round((float) $stats->average_per_transaction, 2);

        $growthPercentage = $this->calculateWasteGrowth($year, $month);

        $byCategory = DB::table('tabung_sampah')
            ->where('status', $approvedStatus)
            ->whereYear('created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('created_at', $month))
            ->select(
                'jenis_sampah as nama_kategori',
                DB::raw('SUM(berat_kg) as total_berat'),
                DB::raw('COUNT(*) as jumlah')
            )
            ->groupBy('jenis_sampah')
            ->orderByDesc('total_berat')
            ->get()
            ->map(function ($item) use ($totalWaste) {
                $totalBerat = (float) $item->total_berat;
                return [
                    'nama_kategori' => ucfirst($item->nama_kategori),
                    'total_berat' => round($totalBerat, 2),
                    'jumlah' => (int) $item->jumlah,
                    'percentage' => $totalWaste > 0 ? round(($totalBerat / $totalWaste * 100), 2) : 0,
                ];
            })
            ->values()
            ->toArray();

        $monthlyTrend = $this->getMonthlyWasteTrend($year);

        $topContributors = DB::table('tabung_sampah')
            ->join('users', 'tabung_sampah.user_id', '=', 'users.user_id')
            ->where('tabung_sampah.status', $approvedStatus)
            ->whereYear('tabung_sampah.created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('tabung_sampah.created_at', $month))
            ->select(
                'users.nama',
                DB::raw('SUM(tabung_sampah.berat_kg) as total_berat')
            )
            ->groupBy('users.user_id', 'users.nama')
            ->orderByDesc('total_berat')
            ->limit(10)
            ->get()
            ->map(function ($item) use ($totalWaste) {
                $totalBerat = (float) $item->total_berat;
                return [
                    'nama' => $item->nama,
                    'total_berat' => round($totalBerat, 2),
                    'percentage' => $totalWaste > 0 ? round(($totalBerat / $totalWaste * 100), 2) : 0,
                ];
            })
            ->values()
            ->toArray();

        return [
            'totalWaste' => round($totalWaste, 2),
            'totalTransactions' => $totalTransactions,
            'averagePerTransaction' => $averagePerTransaction,
            'growthPercentage' => $growthPercentage,
            'byCategory' => $byCategory,
            'monthlyTrend' => $monthlyTrend,
            'topContributors' => $topContributors,
        ];
    }

    // Calculate waste growth
    private function calculateWasteGrowth($year, $month = null)
    {
        $approvedStatus = 'approved';

        if ($month) {
            $currentTotal = DB::table('tabung_sampah')
                ->where('status', $approvedStatus)
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->sum('berat_kg') ?? 0;

            $prevMonth = $month == 1 ? 12 : $month - 1;
            $prevYear = $month == 1 ? $year - 1 : $year;

            $previousTotal = DB::table('tabung_sampah')
                ->where('status', $approvedStatus)
                ->whereYear('created_at', $prevYear)
                ->whereMonth('created_at', $prevMonth)
                ->sum('berat_kg') ?? 0;
        } else {
            $currentTotal = DB::table('tabung_sampah')
                ->where('status', $approvedStatus)
                ->whereYear('created_at', $year)
                ->sum('berat_kg') ?? 0;

            $previousTotal = DB::table('tabung_sampah')
                ->where('status', $approvedStatus)
                ->whereYear('created_at', $year - 1)
                ->sum('berat_kg') ?? 0;
        }

        return $this->calculateGrowthPercentage($currentTotal, $previousTotal);
    }

    // Get monthly waste trend
    private function getMonthlyWasteTrend($year)
    {
        $approvedStatus = 'approved';

        $monthlyData = DB::table('tabung_sampah')
            ->where('status', $approvedStatus)
            ->whereYear('created_at', $year)
            ->select(
                DB::raw('MONTH(created_at) as month_num'),
                DB::raw('SUM(berat_kg) as total')
            )
            ->groupBy(DB::raw('MONTH(created_at)'))
            ->pluck('total', 'month_num')
            ->toArray();

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $trend = [];

        for ($i = 1; $i <= 12; $i++) {
            $trend[] = [
                'month' => $months[$i - 1],
                'total' => round((float) ($monthlyData[$i] ?? 0), 2),
            ];
        }

        return $trend;
    }

    // Calculate growth percentage
    private function calculateGrowthPercentage($currentValue, $previousValue)
    {
        if ($previousValue == 0) {
            return $currentValue > 0 ? 100.0 : 0.0;
        }

        return round((($currentValue - $previousValue) / $previousValue) * 100, 2);
    }

    // GET /api/admin/analytics/waste-by-user
    public function wasteByUser(Request $request)
    {
        try {
            $limit = min($request->query('limit', 10), 100);
            $page = max($request->query('page', 1), 1);
            $year = $request->query('year', null);
            $month = $request->query('month', null);
            $search = $request->query('search', null);
            $sort = $request->query('sort', 'total_kg');
            $offset = ($page - 1) * $limit;

            $query = DB::table('users')
                ->leftJoin('tabung_sampah', 'users.user_id', '=', 'tabung_sampah.user_id')
                ->where(function ($q) {
                    $q->whereNull('users.role_id')
                        ->orWhere('users.role_id', '!=', 1);
                })
                ->whereNull('users.deleted_at');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('users.nama', 'like', "%{$search}%")
                        ->orWhere('users.email', 'like', "%{$search}%");
                });
            }

            if ($year) {
                $query->whereYear('tabung_sampah.created_at', $year);
            }

            if ($month) {
                $query->whereMonth('tabung_sampah.created_at', $month);
            }

            $baseQuery = clone $query;

            $records = $query->select(
                    'users.user_id',
                    'users.nama as nama_lengkap',
                    'users.email',
                    DB::raw('COUNT(tabung_sampah.tabung_sampah_id) as total_deposits'),
                    DB::raw('COALESCE(SUM(tabung_sampah.berat_kg), 0) as total_kg'),
                    DB::raw('COALESCE(SUM(tabung_sampah.poin_didapat), 0) as total_points'),
                    DB::raw('COALESCE(SUM(CASE WHEN tabung_sampah.status = "pending" THEN tabung_sampah.berat_kg ELSE 0 END), 0) as pending_kg'),
                    DB::raw('COALESCE(SUM(CASE WHEN tabung_sampah.status = "pending" THEN tabung_sampah.poin_didapat ELSE 0 END), 0) as pending_points'),
                    DB::raw('COALESCE(SUM(CASE WHEN tabung_sampah.status = "approved" THEN tabung_sampah.berat_kg ELSE 0 END), 0) as approved_kg'),
                    DB::raw('COALESCE(SUM(CASE WHEN tabung_sampah.status = "approved" THEN tabung_sampah.poin_didapat ELSE 0 END), 0) as approved_points'),
                    DB::raw('ROUND(AVG(tabung_sampah.berat_kg), 2) as avg_per_deposit'),
                    DB::raw('MAX(tabung_sampah.created_at) as last_deposit')
                )
                ->groupBy('users.user_id', 'users.nama', 'users.email')
                ->having('total_deposits', '>', 0)
                ->orderByDesc($sort === 'deposits' ? 'total_deposits' : 'total_kg')
                ->offset($offset)
                ->limit($limit)
                ->get();

            $totalCountQuery = DB::table(
                DB::raw("({$baseQuery->select('users.user_id', DB::raw('COUNT(tabung_sampah.tabung_sampah_id) as cnt'))
                    ->groupBy('users.user_id')
                    ->having('cnt', '>', 0)
                    ->toSql()}) as subquery")
            );

            $totalCountQuery->mergeBindings($baseQuery);
            $total = DB::table('users')
                ->leftJoin('tabung_sampah', 'users.user_id', '=', 'tabung_sampah.user_id')
                ->where(function ($q) {
                    $q->whereNull('users.role_id')
                        ->orWhere('users.role_id', '!=', 1);
                })
                ->whereNull('users.deleted_at')
                ->when($search, function ($q) use ($search) {
                    $q->where(function ($sq) use ($search) {
                        $sq->where('users.nama', 'like', "%{$search}%")
                            ->orWhere('users.email', 'like', "%{$search}%");
                    });
                })
                ->when($year, fn($q) => $q->whereYear('tabung_sampah.created_at', $year))
                ->when($month, fn($q) => $q->whereMonth('tabung_sampah.created_at', $month))
                ->select('users.user_id', DB::raw('COUNT(tabung_sampah.tabung_sampah_id) as cnt'))
                ->groupBy('users.user_id')
                ->havingRaw('COUNT(tabung_sampah.tabung_sampah_id) > 0')
                ->get()
                ->count();

            $lastPage = ceil($total / $limit);

            $formattedRecords = $records->map(function ($record) {
                $mostCommonWaste = DB::table('tabung_sampah')
                    ->where('user_id', $record->user_id)
                    ->select('jenis_sampah', DB::raw('COUNT(*) as cnt'))
                    ->groupBy('jenis_sampah')
                    ->orderByDesc('cnt')
                    ->limit(1)
                    ->first();

                return [
                    'user_id' => (int) $record->user_id,
                    'nama_lengkap' => $record->nama_lengkap,
                    'email' => $record->email,
                    'total_deposits' => (int) $record->total_deposits,
                    'total_kg' => round((float) $record->total_kg, 2),
                    'total_points' => (int) $record->total_points,
                    'pending_kg' => round((float) $record->pending_kg, 2),
                    'pending_points' => (int) $record->pending_points,
                    'approved_kg' => round((float) $record->approved_kg, 2),
                    'approved_points' => (int) $record->approved_points,
                    'avg_per_deposit' => round((float) ($record->avg_per_deposit ?? 0), 2),
                    'last_deposit' => $record->last_deposit,
                    'most_common_waste' => $mostCommonWaste ? ucfirst($mostCommonWaste->jenis_sampah) : null,
                ];
            })->toArray();

            return response()->json([
                'success' => true,
                'data' => [
                    'records' => $formattedRecords,
                    'pagination' => [
                        'current_page' => (int) $page,
                        'per_page' => (int) $limit,
                        'total' => (int) $total,
                        'last_page' => (int) $lastPage,
                    ]
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch waste by user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/analytics/points
    public function points(Request $request)
    {
        try {
            $period = $request->query('period', 'monthly');
            $year = $request->query('year', Carbon::now()->year);
            $month = $request->query('month', null);

            $cacheKey = "points_analytics_{$period}_{$year}_{$month}";

            $data = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($period, $year, $month) {
                return $this->executePointsAnalytics($period, $year, $month);
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch points analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Execute points analytics
    private function executePointsAnalytics($period, $year, $month)
    {
        $baseQuery = DB::table('poin_transaksis')
            ->whereYear('created_at', $year);

        if ($month) {
            $baseQuery->whereMonth('created_at', $month);
        }

        $totalDistributed = (clone $baseQuery)
            ->where('poin_didapat', '>', 0)
            ->sum('poin_didapat') ?? 0;

        $totalRedeemed = DB::table('penukaran_produk')
            ->where('status', 'approved')
            ->whereYear('created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('created_at', $month))
            ->sum('poin_digunakan') ?? 0;

        $totalTransactions = (clone $baseQuery)->count();

        $bySourceData = DB::table('poin_transaksis')
            ->whereYear('created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('created_at', $month))
            ->where('poin_didapat', '>', 0)
            ->select(
                'sumber',
                DB::raw('SUM(poin_didapat) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('sumber')
            ->get();

        $bySource = [];
        foreach ($bySourceData as $source) {
            $sourceName = $this->formatSourceName($source->sumber);
            $bySource[$sourceName] = [
                'total' => (int) $source->total,
                'count' => (int) $source->count,
            ];
        }

        $monthlyDistribution = $this->getMonthlyPointsDistribution($year);

        $topUsers = DB::table('poin_transaksis')
            ->join('users', 'poin_transaksis.user_id', '=', 'users.user_id')
            ->whereYear('poin_transaksis.created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('poin_transaksis.created_at', $month))
            ->select(
                'users.nama',
                'users.email',
                DB::raw('SUM(CASE WHEN poin_transaksis.poin_didapat > 0 THEN poin_transaksis.poin_didapat ELSE 0 END) as total_earned'),
                DB::raw('users.actual_poin as current_balance')  // FIXED: Use actual_poin
            )
            ->groupBy('users.user_id', 'users.nama', 'users.email', 'users.actual_poin')  // FIXED: Use actual_poin
            ->orderByDesc('total_earned')
            ->limit(10)
            ->get();

        $totalSpentByUser = DB::table('penukaran_produk')
            ->where('status', 'approved')
            ->whereYear('created_at', $year)
            ->when($month, fn($q) => $q->whereMonth('created_at', $month))
            ->select('user_id', DB::raw('SUM(poin_digunakan) as total_spent'))
            ->groupBy('user_id')
            ->pluck('total_spent', 'user_id')
            ->toArray();

        $formattedTopUsers = $topUsers->map(function ($user) use ($totalSpentByUser) {
            $userId = DB::table('users')->where('email', $user->email)->value('user_id');
            $totalSpent = $totalSpentByUser[$userId] ?? 0;

            return [
                'nama' => $user->nama,
                'email' => $user->email,
                'total_earned' => (int) $user->total_earned,
                'total_spent' => (int) $totalSpent,
                'current_balance' => (int) $user->current_balance,
            ];
        })->toArray();

        $growthPercentage = $this->calculatePointsGrowth($year, $month);

        return [
            'totalDistributed' => (int) $totalDistributed,
            'totalRedeemed' => (int) $totalRedeemed,
            'totalTransactions' => (int) $totalTransactions,
            'growthPercentage' => $growthPercentage,
            'bySource' => $bySource,
            'monthlyDistribution' => $monthlyDistribution,
            'topUsers' => $formattedTopUsers,
        ];
    }

    // Format source name
    private function formatSourceName($sumber)
    {
        $mapping = [
            'setor_sampah' => 'Setoran Sampah',
            'referral' => 'Referral',
            'pembelian' => 'Pembelian',
            'challenges' => 'Challenges',
            'bonus' => 'Bonus',
            'badge' => 'Badge Reward',
            'koreksi' => 'Koreksi Admin',
        ];

        return $mapping[$sumber] ?? ucfirst(str_replace('_', ' ', $sumber));
    }

    // Get monthly points distribution
    private function getMonthlyPointsDistribution($year)
    {
        $monthlyData = DB::table('poin_transaksis')
            ->whereYear('created_at', $year)
            ->where('poin_didapat', '>', 0)
            ->select(
                DB::raw('MONTH(created_at) as month_num'),
                DB::raw('SUM(poin_didapat) as total')
            )
            ->groupBy(DB::raw('MONTH(created_at)'))
            ->pluck('total', 'month_num')
            ->toArray();

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $distribution = [];

        for ($i = 1; $i <= 12; $i++) {
            $distribution[] = [
                'month' => $months[$i - 1],
                'total' => (int) ($monthlyData[$i] ?? 0),
            ];
        }

        return $distribution;
    }

    // Calculate points growth
    private function calculatePointsGrowth($year, $month = null)
    {
        if ($month) {
            $currentTotal = DB::table('poin_transaksis')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->where('poin_didapat', '>', 0)
                ->sum('poin_didapat') ?? 0;

            $prevMonth = $month == 1 ? 12 : $month - 1;
            $prevYear = $month == 1 ? $year - 1 : $year;

            $previousTotal = DB::table('poin_transaksis')
                ->whereYear('created_at', $prevYear)
                ->whereMonth('created_at', $prevMonth)
                ->where('poin_didapat', '>', 0)
                ->sum('poin_didapat') ?? 0;
        } else {
            $currentTotal = DB::table('poin_transaksis')
                ->whereYear('created_at', $year)
                ->where('poin_didapat', '>', 0)
                ->sum('poin_didapat') ?? 0;

            $previousTotal = DB::table('poin_transaksis')
                ->whereYear('created_at', $year - 1)
                ->where('poin_didapat', '>', 0)
                ->sum('poin_didapat') ?? 0;
        }

        return $this->calculateGrowthPercentage($currentTotal, $previousTotal);
    }

    // Clear analytics cache
    public static function clearCache()
    {
        Cache::forget('waste_analytics_*');
        Cache::forget('points_analytics_*');
    }
}
