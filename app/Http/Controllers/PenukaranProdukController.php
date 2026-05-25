<?php

namespace App\Http\Controllers;

use App\Models\PenukaranProduk;
use App\Services\PointService;
use Illuminate\Http\Request;
use App\Http\Resources\PenukaranProdukResource;

class PenukaranProdukController extends Controller
{
    // GET /api/penukaran-produk
    public function index(Request $request)
    {
        try {
            $query = PenukaranProduk::with('produk')
                ->where('user_id', $request->user()->user_id)
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status !== 'semua') {
                $query->where('status', $request->status);
            }

            $redemptions = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => PenukaranProdukResource::collection($redemptions)
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching product redemptions:', [
                'user_id' => $request->user()->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data penukaran produk'
            ], 500);
        }
    }

    // GET /api/penukaran-produk/{id}
    public function show(Request $request, $id)
    {
        try {
            $redemption = PenukaranProduk::with('produk')
                ->where('user_id', $request->user()->user_id)
                ->findOrFail($id);

            return response()->json([
                'status' => 'success',
                'data' => new PenukaranProdukResource($redemption)
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data penukaran tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching redemption detail:', [
                'redemption_id' => $id,
                'user_id' => $request->user()->user_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil detail penukaran'
            ], 500);
        }
    }

    // POST /api/penukaran-produk
    public function store(Request $request)
    {
        try {
            // Accept both jumlah_poin (from frontend) and jumlah (from API)
            $input = $request->all();

            // If frontend sends jumlah_poin, convert it to points directly
            if (isset($input['jumlah_poin'])) {
                $totalPoin = (int) $input['jumlah_poin'];
                $jumlah = isset($input['jumlah']) ? $input['jumlah'] : 1;
            } else {
                // Legacy: calculate from jumlah
                $jumlah = $input['jumlah'] ?? 1;
                $totalPoin = null; // will calculate below
            }

            $validated = $request->validate([
                'produk_id' => 'required|exists:produks,produk_id',
                'metode_ambil' => 'required|string',
            ]);

            $user = $request->user();
            $produk = \App\Models\Produk::where('produk_id', $validated['produk_id'])->firstOrFail();

            // Calculate total points if not provided
            if ($totalPoin === null) {
                $totalPoin = $produk->harga_poin * $jumlah;
            }

            // Check if product has enough stock
            if ($produk->stok < $jumlah) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Stok produk tidak mencukupi',
                    'data' => [
                        'requested' => $jumlah,
                        'available' => $produk->stok
                    ]
                ], 400);
            }

            // Use PointService to handle point deduction with validation
            try {
                PointService::deductPointsForRedemption($user, $totalPoin);
            } catch (\Exception $e) {
                return response()->json([
                    'status' => 'error',
                    'message' => $e->getMessage(),
                    'data' => [
                        'required_points' => $totalPoin,
                        'current_points' => $user->actual_poin,
                        'shortage' => max(0, $totalPoin - $user->actual_poin)
                    ]
                ], 400);
            }

            \DB::beginTransaction();

            try {
                // Create redemption record
                $redemption = PenukaranProduk::create([
                    'user_id' => $user->user_id,
                    'produk_id' => $produk->produk_id,
                    'nama_produk' => $produk->nama,
                    'poin_digunakan' => $totalPoin,
                    'jumlah' => $jumlah,
                    'status' => 'pending',
                    'metode_ambil' => $validated['metode_ambil'],
                    'catatan' => $request->catatan ?? null,
                    'tanggal_penukaran' => now(),
                    'tanggal_diambil' => null,
                ]);

                // Reduce product stock
                $produk->decrement('stok', $jumlah);

                \DB::commit();

                // Reload relationships and refresh user data from database
                $redemption->load('produk');
                $user->refresh();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Penukaran produk berhasil dibuat',
                    'data' => new PenukaranProdukResource($redemption)
                ], 201);

            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating product redemption:', [
                'user_id' => $request->user()->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat membuat penukaran produk'
            ], 500);
        }
    }

    // PUT /api/penukaran-produk/{id}
    public function update(Request $request, $id)
    {
        try {
            $redemption = PenukaranProduk::findOrFail($id);

            $validated = $request->validate([
                'status' => 'sometimes|required|in:pending,approved,cancelled',
                'metode_ambil' => 'sometimes|required|string',
                'catatan' => 'sometimes|nullable|string',
                'tanggal_diambil' => 'sometimes|nullable|date',
            ]);

            $redemption->update($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Penukaran berhasil diperbarui',
                'data' => new PenukaranProdukResource($redemption)
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data penukaran tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error updating redemption:', [
                'redemption_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat memperbarui penukaran'
            ], 500);
        }
    }

    // PUT /api/penukaran-produk/{id}/cancel
    public function cancel(Request $request, $id)
    {
        try {
            $redemption = PenukaranProduk::where('user_id', $request->user()->user_id)
                ->findOrFail($id);

            // Only allow canceling pending orders
            if ($redemption->status !== 'pending') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Hanya pesanan pending yang bisa dibatalkan',
                    'current_status' => $redemption->status
                ], 400);
            }

            \DB::beginTransaction();

            try {
                // CRITICAL: Use PointService to refund points
                // This will:
                // - Update ONLY actual_poin (NOT display_poin)
                // - Record transaction in poin_transaksis with POSITIVE value (refund)
                PointService::refundRedemptionPoints(
                    $redemption->user_id,
                    $redemption->poin_digunakan,
                    $redemption->penukaran_produk_id ?? $redemption->id
                );

                // Return stock to product
                $produk = $redemption->produk;
                $produk->increment('stok', $redemption->jumlah);

                // Update redemption status to cancelled
                $redemption->update(['status' => 'cancelled']);

                \DB::commit();

                // Refresh data from database
                $user = $redemption->user;
                $user->refresh();
                $redemption->refresh();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Penukaran berhasil dibatalkan, poin telah dikembalikan',
                    'data' => [
                        'id' => $redemption->penukaran_produk_id ?? $redemption->id,
                        'status' => $redemption->status,
                        'poin_dikembalikan' => $redemption->poin_digunakan,
                        'user_actual_poin' => $user->actual_poin,
                        'user_display_poin' => $user->display_poin, // Should remain unchanged
                        'stok_dikembalikan' => $redemption->jumlah
                    ]
                ], 200);

            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data penukaran tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error cancelling redemption:', [
                'redemption_id' => $id,
                'user_id' => $request->user()->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat membatalkan penukaran'
            ], 500);
        }
    }

    // DELETE /api/penukaran-produk/{id}
    public function destroy(Request $request, $id)
    {
        try {
            $redemption = PenukaranProduk::where('user_id', $request->user()->user_id)
                ->findOrFail($id);

            // Only allow deleting pending or cancelled orders
            if (!in_array($redemption->status, ['pending', 'cancelled'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Hanya pesanan pending atau cancelled yang bisa dihapus',
                    'current_status' => $redemption->status
                ], 400);
            }

            \DB::beginTransaction();

            try {
                // Only refund if not already cancelled
                if ($redemption->status !== 'cancelled') {
                    // CRITICAL: Use PointService to refund points
                    PointService::refundRedemptionPoints(
                        $redemption->user_id,
                        $redemption->poin_digunakan,
                        $redemption->penukaran_produk_id ?? $redemption->id
                    );

                    $produk = $redemption->produk;
                    $produk->increment('stok', $redemption->jumlah);
                }

                // Delete the redemption record
                $redemption->delete();

                \DB::commit();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Penukaran berhasil dihapus'
                ], 200);

            } catch (\Exception $e) {
                \DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data penukaran tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Error deleting redemption:', [
                'redemption_id' => $id,
                'user_id' => $request->user()->user_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat menghapus penukaran'
            ], 500);
        }
    }

    // GET /api/penukaran-produk/user/{userId}
    public function byUser(Request $request, $userId)
    {
        try {
            // IDOR Protection: User can only view their own data
            if ((int)$request->user()->user_id !== (int)$userId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized'
                ], 403);
            }

            $query = PenukaranProduk::select([
                    'penukaran_produk_id', 'user_id', 'produk_id',
                    'jumlah', 'poin_digunakan', 'status', 'metode_ambil',
                    'catatan', 'tanggal_diambil', 'created_at', 'updated_at'
                ])
                ->with(['produk:produk_id,nama,harga_poin,foto,deskripsi'])
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status') && $request->status !== 'semua') {
                $query->where('status', $request->status);
            }

            // Limit results to prevent large data transfer
            $redemptions = $query->limit(100)->get();

            return response()->json([
                'status' => 'success',
                'data' => PenukaranProdukResource::collection($redemptions)
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error fetching user product redemptions:', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat mengambil data penukaran produk'
            ], 500);
        }
    }
}
