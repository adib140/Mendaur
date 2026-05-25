<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\PoinTransaksi;
use App\Models\PenukaranProduk;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminPointController extends Controller
{
    // GET /api/poin/admin/stats
    public function getStats(Request $request)
    {
        try {
            // Get total points in system (using display_poin for total accumulated)
            $totalPointsInSystem = User::sum('display_poin');

            // Get active users (users with activity in last 30 days)
            $activeUsers = User::where('updated_at', '>=', Carbon::now()->subDays(30))
                ->count();

            // Get total distributions (total transactions)
            $totalDistributions = PoinTransaksi::count();

            // Get recent activity (last 10 transactions)
            $recentActivity = PoinTransaksi::join('users', 'poin_transaksis.user_id', '=', 'users.id')
                ->select(
                    'poin_transaksis.id',
                    'poin_transaksis.user_id',
                    'users.nama as user_name',
                    'poin_transaksis.poin_didapat as points',
                    'poin_transaksis.sumber as source',
                    'poin_transaksis.keterangan as description',
                    'poin_transaksis.created_at'
                )
                ->orderBy('poin_transaksis.created_at', 'DESC')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'user_id' => $item->user_id,
                        'user_name' => $item->user_name,
                        'points' => $item->points,
                        'source' => $item->source,
                        'description' => $item->description,
                        'created_at' => $item->created_at->toIso8601String(),
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_points_in_system' => $totalPointsInSystem,
                    'active_users' => $activeUsers,
                    'total_distributions' => $totalDistributions,
                    'recent_activity' => $recentActivity,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data statistik: ' . $e->getMessage(),
            ], 500);
        }
    }

    // GET /api/poin/admin/history
    public function getHistory(Request $request)
    {
        try {
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 10);
            $userId = $request->input('user_id');
            $type = $request->input('type'); // sumber filter
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            $query = PoinTransaksi::join('users', 'poin_transaksis.user_id', '=', 'users.id')
                ->select(
                    'poin_transaksis.id',
                    'poin_transaksis.user_id',
                    'users.nama as user_name',
                    'poin_transaksis.poin_didapat as points',
                    'poin_transaksis.sumber as source',
                    'poin_transaksis.jenis_sampah as waste_type',
                    'poin_transaksis.berat_kg as weight_kg',
                    'poin_transaksis.keterangan as description',
                    'poin_transaksis.created_at'
                );

            // Apply filters
            if ($userId) {
                $query->where('poin_transaksis.user_id', $userId);
            }

            if ($type) {
                $query->where('poin_transaksis.sumber', $type);
            }

            if ($startDate) {
                $query->whereDate('poin_transaksis.created_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('poin_transaksis.created_at', '<=', $endDate);
            }

            // Get total count before pagination
            $total = $query->count();

            // Get paginated results
            $transactions = $query->orderBy('poin_transaksis.created_at', 'DESC')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'user_id' => $item->user_id,
                        'user_name' => $item->user_name,
                        'points' => $item->points,
                        'source' => $item->source,
                        'waste_type' => $item->waste_type,
                        'weight_kg' => $item->weight_kg,
                        'description' => $item->description,
                        'created_at' => $item->created_at->toIso8601String(),
                    ];
                });

            $totalPages = ceil($total / $perPage);

            return response()->json([
                'status' => 'success',
                'data' => $transactions,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $totalPages,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data riwayat: ' . $e->getMessage(),
            ], 500);
        }
    }

    // GET /api/poin/admin/redemptions
    public function getRedemptions(Request $request)
    {
        try {
            $page = $request->input('page', 1);
            $perPage = $request->input('per_page', 8);
            $userId = $request->input('user_id');
            $status = $request->input('status');

            $query = PenukaranProduk::join('users', 'penukaran_produk.user_id', '=', 'users.id')
                ->join('produks', 'penukaran_produk.produk_id', '=', 'produks.id')
                ->select(
                    'penukaran_produk.id',
                    'penukaran_produk.user_id',
                    'users.nama as user_name',
                    'penukaran_produk.produk_id',
                    'produks.nama as product_name',
                    'produks.foto as product_image',
                    'penukaran_produk.poin_digunakan as points_used',
                    'penukaran_produk.jumlah as quantity',
                    'penukaran_produk.status',
                    'penukaran_produk.metode_ambil as pickup_method',
                    'penukaran_produk.created_at',
                    'penukaran_produk.tanggal_diambil as pickup_date'
                );

            // Apply filters
            if ($userId) {
                $query->where('penukaran_produk.user_id', $userId);
            }

            if ($status) {
                $query->where('penukaran_produk.status', $status);
            }

            // Get total count before pagination
            $total = $query->count();

            // Get paginated results
            $redemptions = $query->orderBy('penukaran_produk.created_at', 'DESC')
                ->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get()
                ->map(function ($item) {
                    $productImageUrl = null;
                    if ($item->product_image) {
                        $productImageUrl = asset('storage/' . $item->product_image);
                    }

                    return [
                        'id' => $item->id,
                        'user_id' => $item->user_id,
                        'user_name' => $item->user_name,
                        'product_id' => $item->produk_id,
                        'product_name' => $item->product_name,
                        'product_image' => $productImageUrl,
                        'points_used' => $item->points_used,
                        'quantity' => $item->quantity,
                        'status' => $item->status,
                        'pickup_method' => $item->pickup_method,
                        'created_at' => $item->created_at->toIso8601String(),
                        'pickup_date' => $item->pickup_date ? $item->pickup_date->toIso8601String() : null,
                    ];
                });

            $totalPages = ceil($total / $perPage);

            return response()->json([
                'status' => 'success',
                'data' => $redemptions,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => $totalPages,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data penukaran produk: ' . $e->getMessage(),
            ], 500);
        }
    }

    // GET /api/poin/breakdown/all
    public function getBreakdown(Request $request)
    {
        try {
            // Get total points in system (using display_poin)
            $totalPoints = User::sum('display_poin');

            // Get breakdown by source (sumber) with transaction counts
            $breakdown = PoinTransaksi::select(
                'sumber as source',
                DB::raw('SUM(poin_didapat) as total_points'),
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('ROUND((SUM(poin_didapat) / ' . ($totalPoints > 0 ? $totalPoints : 1) . ' * 100), 2) as percentage')
            )
                ->groupBy('sumber')
                ->orderBy('total_points', 'DESC')
                ->get()
                ->map(function ($item) use ($totalPoints) {
                    return [
                        'source' => $item->source,
                        'total_points' => $item->total_points,
                        'transaction_count' => $item->transaction_count,
                        'percentage' => $totalPoints > 0 ? round(($item->total_points / $totalPoints) * 100, 2) : 0,
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_points' => $totalPoints,
                    'sources' => $breakdown,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data breakdown: ' . $e->getMessage(),
            ], 500);
        }
    }
}
