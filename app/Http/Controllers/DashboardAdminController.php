<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\TabungSampah;
use App\Models\PoinTransaksi;
use App\Models\PenukaranProduk;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardAdminController extends Controller
{
    // GET /api/admin/dashboard/users
    public function getUsers(Request $request)
    {
        try {
            $page = $request->get('page', 1);
            $perPage = $request->get('per_page', 10);
            $search = $request->get('search');

            $query = User::with(['tabungSampah' => function ($q) {
                $q->where('status', 'approved');
            }])
                ->select('user_id', 'nama', 'email', 'no_hp', 'actual_poin', 'display_poin', 'level', 'created_at', 'updated_at');

            if ($search) {
                $query->where('nama', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            }

            $users = $query->orderBy('created_at', 'DESC')
                ->paginate($perPage, ['*'], 'page', $page);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'users' => $users->items(),
                    'pagination' => [
                        'current_page' => $users->currentPage(),
                        'per_page' => $users->perPage(),
                        'total' => $users->total(),
                        'total_pages' => $users->lastPage(),
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/dashboard/waste-summary
    public function getWasteSummary(Request $request)
    {
        try {
            $period = $request->get('period', 'monthly'); // monthly, daily, yearly
            $year = $request->get('year', date('Y'));
            $month = $request->get('month', date('m'));

            $query = TabungSampah::where('status', 'approved')
                ->select(
                    'jenis_sampah',
                    DB::raw('SUM(berat_kg) as total_berat'),
                    DB::raw('COUNT(*) as jumlah_setor'),
                    DB::raw('DATE(created_at) as tanggal'),
                    DB::raw('MONTH(created_at) as bulan'),
                    DB::raw('YEAR(created_at) as tahun'),
                    DB::raw('DATE_FORMAT(created_at, "%Y-%m") as periode_bulan'),
                    DB::raw('DATE_FORMAT(created_at, "%Y") as periode_tahun')
                );

            // Filter by period
            if ($period === 'daily') {
                if ($month && $year) {
                    $query->whereMonth('created_at', $month)
                        ->whereYear('created_at', $year);
                }
                $data = $query->groupBy('tanggal', 'jenis_sampah')
                    ->orderBy('tanggal', 'DESC')
                    ->get();
            } elseif ($period === 'yearly') {
                $data = $query->groupBy('periode_tahun', 'jenis_sampah')
                    ->orderBy('periode_tahun', 'DESC')
                    ->limit(12)
                    ->get();
            } else { // monthly
                $data = $query->groupBy('periode_bulan', 'jenis_sampah')
                    ->orderBy('periode_bulan', 'DESC')
                    ->limit(12)
                    ->get();
            }

            // Add chart data
            $chartData = $this->formatWasteChartData($data, $period);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $data,
                    'chart_data' => $chartData,
                    'total_berat' => $data->sum('total_berat'),
                    'total_setor' => $data->sum('jumlah_setor'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch waste summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/dashboard/point-summary
    public function getPointSummary(Request $request)
    {
        try {
            $period = $request->get('period', 'monthly'); // monthly, daily, yearly
            $year = $request->get('year', date('Y'));
            $month = $request->get('month', date('m'));

            $query = PoinTransaksi::select(
                'sumber as source',
                DB::raw('SUM(poin_didapat) as total_poin'),
                DB::raw('COUNT(*) as jumlah_transaksi'),
                DB::raw('DATE(created_at) as tanggal'),
                DB::raw('MONTH(created_at) as bulan'),
                DB::raw('YEAR(created_at) as tahun'),
                DB::raw('DATE_FORMAT(created_at, "%Y-%m") as periode_bulan'),
                DB::raw('DATE_FORMAT(created_at, "%Y") as periode_tahun')
            );

            // Filter by period
            if ($period === 'daily') {
                if ($month && $year) {
                    $query->whereMonth('created_at', $month)
                        ->whereYear('created_at', $year);
                }
                $data = $query->groupBy('tanggal', 'sumber')
                    ->orderBy('tanggal', 'DESC')
                    ->get();
            } elseif ($period === 'yearly') {
                $data = $query->groupBy('periode_tahun', 'sumber')
                    ->orderBy('periode_tahun', 'DESC')
                    ->limit(5)
                    ->get();
            } else { // monthly
                $data = $query->groupBy('periode_bulan', 'sumber')
                    ->orderBy('periode_bulan', 'DESC')
                    ->limit(12)
                    ->get();
            }

            // Add chart data
            $chartData = $this->formatPointChartData($data, $period);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'summary' => $data,
                    'chart_data' => $chartData,
                    'total_poin' => $data->sum('total_poin'),
                    'total_transaksi' => $data->sum('jumlah_transaksi'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch point summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/dashboard/waste-by-user
    public function getWasteByUser(Request $request)
    {
        try {
            $period = $request->get('period', 'monthly');
            $year = $request->get('year', date('Y'));
            $month = $request->get('month');
            $userId = $request->get('user_id');

            $query = TabungSampah::join('users', 'tabung_sampah.user_id', '=', 'users.id')
                ->where('tabung_sampah.status', 'approved')
                ->select(
                    'users.id as user_id',
                    'users.nama as user_name',
                    'tabung_sampah.jenis_sampah',
                    DB::raw('SUM(tabung_sampah.berat_kg) as total_berat'),
                    DB::raw('SUM(tabung_sampah.poin_didapat) as total_poin'),
                    DB::raw('COUNT(*) as jumlah_setor'),
                    DB::raw('DATE_FORMAT(tabung_sampah.created_at, "%Y-%m") as periode_bulan'),
                    DB::raw('DATE(tabung_sampah.created_at) as tanggal')
                );

            if ($userId) {
                $query->where('users.id', $userId);
            }

            if ($year) {
                $query->whereYear('tabung_sampah.created_at', $year);
            }

            if ($month && $period === 'daily') {
                $query->whereMonth('tabung_sampah.created_at', $month);
            }

            if ($period === 'daily') {
                $data = $query->groupBy('tanggal', 'user_id', 'jenis_sampah')
                    ->orderBy('tanggal', 'DESC')
                    ->get();
            } else {
                $data = $query->groupBy('periode_bulan', 'user_id', 'jenis_sampah')
                    ->orderBy('periode_bulan', 'DESC')
                    ->get();
            }

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch waste by user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/dashboard/report
    public function getReport(Request $request)
    {
        try {
            $reportType = $request->get('type', 'monthly'); // monthly, daily
            $year = $request->get('year', date('Y'));
            $month = $request->get('month', date('m'));
            $day = $request->get('day', date('d'));

            if ($reportType === 'daily') {
                $date = Carbon::createFromDate($year, $month, $day);
                $report = $this->generateDailyReport($date);
            } else {
                $date = Carbon::createFromDate($year, $month, 1);
                $report = $this->generateMonthlyReport($date);
            }

            return response()->json([
                'status' => 'success',
                'data' => $report
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/dashboard/overview
    public function getOverview(Request $request)
    {
        try {
            $year = $request->get('year', date('Y'));
            $month = $request->get('month', date('m'));

            // Waste statistics
            $totalWaste = TabungSampah::where('status', 'approved')
                ->whereYear('created_at', $year)
                ->sum('berat_kg');

            $totalWasteCount = TabungSampah::where('status', 'approved')
                ->whereYear('created_at', $year)
                ->count();

            $monthlyWaste = TabungSampah::where('status', 'approved')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->sum('berat_kg');

            // Point statistics
            $totalPoints = PoinTransaksi::whereYear('created_at', $year)
                ->sum('poin_didapat');

            $monthlyPoints = PoinTransaksi::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->sum('poin_didapat');

            // User statistics
            $totalUsers = User::where('role_id', 1)->count(); // Only nasabah
            $totalAllUsers = User::count();
            $activeUsers = User::where('updated_at', '>=', Carbon::now()->subDays(30))
                ->count();
            $newUsersThisMonth = User::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count();

            // Redemptions - fix column name
            $totalRedemptions = PenukaranProduk::whereIn('status', ['approved', 'completed', 'selesai'])
                ->whereYear('created_at', $year)
                ->sum('poin_digunakan');

            $totalRedemptionsCount = PenukaranProduk::whereIn('status', ['approved', 'completed', 'selesai'])
                ->whereYear('created_at', $year)
                ->count();

            // Pending counts
            $pendingDeposits = TabungSampah::where('status', 'pending')->count();
            $pendingRedemptions = PenukaranProduk::where('status', 'pending')->count();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'waste' => [
                        'yearly_total_kg' => round((float) $totalWaste, 2),
                        'yearly_total_count' => (int) $totalWasteCount,
                        'monthly_total_kg' => round((float) $monthlyWaste, 2),
                        'total_formatted' => $this->formatWeight($totalWaste),
                    ],
                    'points' => [
                        'yearly_total' => (int) $totalPoints,
                        'monthly_total' => (int) $monthlyPoints,
                        'total_distributed' => (int) User::sum('display_poin'),
                    ],
                    'users' => [
                        'total' => (int) $totalAllUsers,
                        'total_nasabah' => (int) $totalUsers,
                        'active_30days' => (int) $activeUsers,
                        'new_this_month' => (int) $newUsersThisMonth,
                    ],
                    'redemptions' => [
                        'yearly_total_points_redeemed' => (int) $totalRedemptions,
                        'yearly_total_count' => (int) $totalRedemptionsCount,
                    ],
                    'pending' => [
                        'deposits' => (int) $pendingDeposits,
                        'redemptions' => (int) $pendingRedemptions,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Helper: format waste chart data
    private function formatWasteChartData($data, $period)
    {
        $grouped = $data->groupBy(function ($item) use ($period) {
            if ($period === 'daily') {
                return $item->tanggal;
            } elseif ($period === 'yearly') {
                return $item->periode_tahun;
            }
            return $item->periode_bulan;
        });

        return $grouped->map(function ($items) {
            return [
                'label' => $items->first()->tanggal ?? $items->first()->periode_bulan ?? $items->first()->periode_tahun,
                'total_berat' => $items->sum('total_berat'),
                'types' => $items->mapWithKeys(function ($item) {
                    return [$item->jenis_sampah => $item->total_berat];
                })->toArray(),
            ];
        })->values()->toArray();
    }

    // Helper: format point chart data
    private function formatPointChartData($data, $period)
    {
        $grouped = $data->groupBy(function ($item) use ($period) {
            if ($period === 'daily') {
                return $item->tanggal;
            } elseif ($period === 'yearly') {
                return $item->periode_tahun;
            }
            return $item->periode_bulan;
        });

        return $grouped->map(function ($items) {
            return [
                'label' => $items->first()->tanggal ?? $items->first()->periode_bulan ?? $items->first()->periode_tahun,
                'total_poin' => $items->sum('total_poin'),
                'sources' => $items->mapWithKeys(function ($item) {
                    return [$item->source => $item->total_poin];
                })->toArray(),
            ];
        })->values()->toArray();
    }

    // Helper: generate daily report
    private function generateDailyReport($date)
    {
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        $waste = TabungSampah::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->where('status', 'approved')
            ->get();

        $points = PoinTransaksi::whereBetween('created_at', [$startOfDay, $endOfDay])
            ->get();

        return [
            'report_type' => 'daily',
            'date' => $date->format('Y-m-d'),
            'waste' => [
                'total_kg' => round($waste->sum('berat_kg'), 2),
                'total_count' => $waste->count(),
                'by_type' => $waste->groupBy('jenis_sampah')->map(function ($items) {
                    return [
                        'count' => $items->count(),
                        'total_kg' => round($items->sum('berat_kg'), 2),
                    ];
                })->toArray(),
            ],
            'points' => [
                'total' => $points->sum('poin_didapat'),
                'by_source' => $points->groupBy('sumber')->map(function ($items) {
                    return [
                        'count' => $items->count(),
                        'total_poin' => $items->sum('poin_didapat'),
                    ];
                })->toArray(),
            ],
            'users_active' => $waste->pluck('user_id')->unique()->count(),
        ];
    }

    // Helper: generate monthly report
    private function generateMonthlyReport($date)
    {
        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        $waste = TabungSampah::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->where('status', 'approved')
            ->get();

        $points = PoinTransaksi::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->get();

        // Daily breakdown
        $dailyBreakdown = [];
        for ($day = 1; $day <= $date->daysInMonth; $day++) {
            $dayDate = $date->copy()->setDay($day);
            $dayWaste = $waste->whereBetween('created_at', [
                $dayDate->copy()->startOfDay(),
                $dayDate->copy()->endOfDay()
            ]);
            $dailyBreakdown[$dayDate->format('Y-m-d')] = [
                'waste_kg' => round($dayWaste->sum('berat_kg'), 2),
                'waste_count' => $dayWaste->count(),
            ];
        }

        return [
            'report_type' => 'monthly',
            'month' => $date->format('Y-m'),
            'month_name' => $date->format('F Y'),
            'waste' => [
                'total_kg' => round($waste->sum('berat_kg'), 2),
                'total_count' => $waste->count(),
                'by_type' => $waste->groupBy('jenis_sampah')->map(function ($items) {
                    return [
                        'count' => $items->count(),
                        'total_kg' => round($items->sum('berat_kg'), 2),
                    ];
                })->toArray(),
            ],
            'points' => [
                'total' => $points->sum('poin_didapat'),
                'by_source' => $points->groupBy('sumber')->map(function ($items) {
                    return [
                        'count' => $items->count(),
                        'total_poin' => $items->sum('poin_didapat'),
                    ];
                })->toArray(),
            ],
            'users_active' => $waste->pluck('user_id')->unique()->count(),
            'daily_breakdown' => $dailyBreakdown,
        ];
    }

    // Helper: format weight with proper unit
    private function formatWeight(float $weight): string
    {
        if ($weight >= 1000) {
            return number_format($weight / 1000, 2, ',', '.') . ' Ton';
        }
        return number_format($weight, 2, ',', '.') . ' Kg';
    }
}
