<?php

namespace App\Http\Controllers;

use App\Models\PenarikanTunai;
use App\Models\User;
use App\Models\Notifikasi;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Resources\PenarikanTunaiResource;

class PenarikanTunaiController extends Controller
{
    // POST /api/penarikan-tunai
    public function store(Request $request)
    {
        $validated = $request->validate([
            'jumlah_poin' => 'required|integer|min:2000',
            'nomor_rekening' => 'required|string|max:50',
            'nama_bank' => 'required|string|max:100',
            'nama_penerima' => 'required|string|max:255'
        ]);

        // Validate multiple of 100
        if ($validated['jumlah_poin'] % 100 !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah poin harus kelipatan 100',
                'errors' => [
                    'jumlah_poin' => ['Jumlah poin harus kelipatan 100']
                ]
            ], 422);
        }

        // Get authenticated user from token
        $user = $request->user();

        // Use actual_poin for validation (semua nasabah bisa withdraw)
        $availablePoin = $user->actual_poin ?? 0;

        if ($availablePoin < $validated['jumlah_poin']) {
            return response()->json([
                'success' => false,
                'message' => 'Poin tidak mencukupi',
                'errors' => [
                    'jumlah_poin' => ["Saldo poin Anda hanya {$availablePoin}"]
                ]
            ], 400);
        }

        // Calculate Rupiah (100 points = Rp 1,000)
        $jumlah_rupiah = ($validated['jumlah_poin'] / 100) * 1000;

        DB::beginTransaction();
        try {
            // Create withdrawal record first
            $withdrawal = PenarikanTunai::create([
                'user_id' => $user->user_id,
                'jumlah_poin' => $validated['jumlah_poin'],
                'jumlah_rupiah' => $jumlah_rupiah,
                'nomor_rekening' => $validated['nomor_rekening'],
                'nama_bank' => $validated['nama_bank'],
                'nama_penerima' => $validated['nama_penerima'],
                'status' => 'pending'
            ]);

            // CRITICAL: Use PointService to deduct points
            // This will:
            // - Update ONLY actual_poin (NOT display_poin)
            // - Record transaction in poin_transaksis with NEGATIVE value
            PointService::deductPointsForWithdrawal(
                $user,
                $validated['jumlah_poin'],
                $withdrawal->penarikan_tunai_id
            );

            // Send notification to user
            Notifikasi::create([
                'user_id' => $user->user_id,
                'judul' => 'Permintaan Penarikan Tunai Diajukan',
                'pesan' => "Permintaan penarikan Rp " . number_format($jumlah_rupiah, 0, ',', '.') . " ({$validated['jumlah_poin']} poin) berhasil diajukan dan sedang diproses",
                'tipe' => 'penarikan_tunai',
                'is_read' => false
            ]);

            DB::commit();

            // Refresh user to get updated poin
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Permintaan penarikan tunai berhasil diajukan',
                'data' => new PenarikanTunaiResource($withdrawal),
                'user_poin' => [
                    'actual_poin' => $user->actual_poin,
                    'display_poin' => $user->display_poin, // Should remain unchanged
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();

            \Log::error('Withdrawal request failed', [
                'user_id' => $user->user_id,
                'jumlah_poin' => $validated['jumlah_poin'],
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memproses penarikan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/penarikan-tunai
    public function index(Request $request)
    {
        $query = PenarikanTunai::where('user_id', $request->user()->user_id);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $withdrawals = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data' => PenarikanTunaiResource::collection($withdrawals->items()),
            'pagination' => [
                'current_page' => $withdrawals->currentPage(),
                'per_page' => $withdrawals->perPage(),
                'total' => $withdrawals->total(),
                'last_page' => $withdrawals->lastPage(),
            ]
        ]);
    }

    // GET /api/penarikan-tunai/{id}
    public function show($id)
    {
        $withdrawal = PenarikanTunai::with(['user', 'processedBy'])
            ->findOrFail($id);

        // Check authorization
        if (auth()->user()->user_id !== $withdrawal->user_id && !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new PenarikanTunaiResource($withdrawal)
        ]);
    }

    // GET /api/penarikan-tunai/summary
    public function summary(Request $request)
    {
        $userId = $request->user()->user_id;

        $summary = [
            'total_withdrawn_points' => PenarikanTunai::where('user_id', $userId)
                ->where('status', 'approved')
                ->sum('jumlah_poin'),
            'total_withdrawn_rupiah' => PenarikanTunai::where('user_id', $userId)
                ->where('status', 'approved')
                ->sum('jumlah_rupiah'),
            'pending_count' => PenarikanTunai::where('user_id', $userId)
                ->where('status', 'pending')
                ->count(),
            'approved_count' => PenarikanTunai::where('user_id', $userId)
                ->where('status', 'approved')
                ->count(),
            'rejected_count' => PenarikanTunai::where('user_id', $userId)
                ->where('status', 'rejected')
                ->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }

    // GET /api/penarikan-tunai/user/{userId}
    public function byUser(Request $request, $userId)
    {
        // IDOR Protection: User can only view their own data
        if ((int)$request->user()->user_id !== (int)$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $query = PenarikanTunai::select([
                'penarikan_tunai_id', 'user_id', 'jumlah_poin', 'jumlah_rupiah',
                'nomor_rekening', 'nama_bank', 'nama_penerima', 'status',
                'created_at', 'updated_at'
            ])
            ->where('user_id', $userId);

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'semua') {
            $query->where('status', $request->status);
        }

        // Limit results to prevent large data transfer
        $withdrawals = $query->orderBy('created_at', 'desc')->limit(100)->get();

        return response()->json([
            'success' => true,
            'status' => 'success',
            'data' => PenarikanTunaiResource::collection($withdrawals)
        ]);
    }
}
