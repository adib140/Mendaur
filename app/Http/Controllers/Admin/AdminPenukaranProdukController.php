<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PenukaranProduk;
use App\Models\User;
use App\Models\Produk;
use App\Models\AuditLog;
use App\Models\PoinTransaksi;
use App\Models\Notifikasi;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AdminPenukaranProdukController extends Controller
{
    /**
     * Get all product exchanges with filtering and pagination
     * GET /api/admin/penukar-produk
     */
    public function index(Request $request)
    {
        // RBAC: Admin+ only - Check if user is admin or superadmin
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can view product exchanges'
            ], 403);
        }

        $query = PenukaranProduk::query();

        // Filter by status (pending, approved, rejected)
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Search by user name or product name
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function (Builder $q) use ($searchTerm) {
                $q->whereHas('user', function (Builder $q) use ($searchTerm) {
                    $q->where('nama', 'like', '%' . $searchTerm . '%');
                })
                ->orWhere('nama_produk', 'like', '%' . $searchTerm . '%');
            });
        }

        // Filter by date range
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100);
        $exchanges = $query->with(['user', 'produk'])->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $exchanges->map(function ($exchange) {
                return [
                    'id' => $exchange->penukaran_produk_id,
                    'user_id' => $exchange->user_id,
                    'user' => [
                        'id' => $exchange->user->user_id ?? null,
                        'email' => $exchange->user->email ?? null,
                        'nama' => $exchange->user->nama ?? null,
                    ],
                    'product_id' => $exchange->produk_id,
                    'product' => [
                        'id' => $exchange->produk?->produk_id ?? null,
                        'foto' => $exchange->produk?->foto ?? null,
                        'nama' => $exchange->nama_produk,
                    ],
                    'poin_digunakan' => (int) $exchange->poin_digunakan,
                    'jumlah' => (int) $exchange->jumlah,
                    'status' => $exchange->status,
                    'metode_ambil' => $exchange->metode_ambil,
                    'catatan' => $exchange->catatan,
                    'alamat_pengiriman' => $exchange->catatan, // Using catatan for address
                    'kota' => null, // Can be added to model if needed
                    'provinsi' => null, // Can be added to model if needed
                    'tanggal_tukar' => $exchange->tanggal_penukaran,
                    'tanggal_diambil' => $exchange->tanggal_diambil,
                    'created_at' => $exchange->created_at,
                    'updated_at' => $exchange->updated_at,
                ];
            }),
            'pagination' => [
                'current_page' => $exchanges->currentPage(),
                'per_page' => $exchanges->perPage(),
                'total' => $exchanges->total(),
                'last_page' => $exchanges->lastPage(),
            ]
        ]);
    }

    /**
     * Get single product exchange detail
     * GET /api/admin/penukar-produk/{exchangeId}
     */
    public function show(Request $request, $exchangeId)
    {
        // RBAC: Admin+ only - Check if user is admin or superadmin
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can view exchange details'
            ], 403);
        }

        $exchange = PenukaranProduk::with(['user', 'produk'])
            ->where('penukaran_produk_id', $exchangeId)
            ->first();

        if (!$exchange) {
            return response()->json([
                'status' => 'error',
                'message' => 'Exchange not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $exchange->penukaran_produk_id,
                'user_id' => $exchange->user_id,
                'user' => [
                    'id' => $exchange->user->user_id ?? null,
                    'email' => $exchange->user->email ?? null,
                    'nama' => $exchange->user->nama ?? null,
                    'poin_saat_ini' => (int) ($exchange->user->actual_poin ?? 0),
                ],
                'product_id' => $exchange->produk_id,
                'product' => [
                    'id' => $exchange->produk?->produk_id ?? null,
                    'foto' => $exchange->produk?->foto ?? null,
                    'nama' => $exchange->nama_produk,
                    'harga' => $exchange->produk?->harga ?? null,
                ],
                'poin_digunakan' => (int) $exchange->poin_digunakan,
                'jumlah' => (int) $exchange->jumlah,
                'status' => $exchange->status,
                'metode_ambil' => $exchange->metode_ambil,
                'catatan' => $exchange->catatan,
                'alamat_pengiriman' => $exchange->catatan,
                'shipping_cost' => 10000, // Default shipping cost
                'insurance_cost' => 5000, // Default insurance cost
                'tanggal_tukar' => $exchange->tanggal_penukaran,
                'tanggal_diambil' => $exchange->tanggal_diambil,
                'created_at' => $exchange->created_at,
                'updated_at' => $exchange->updated_at,
            ]
        ]);
    }

    /**
     * Approve product exchange
     * PATCH /api/admin/penukar-produk/{exchangeId}/approve
     */
    public function approve(Request $request, $exchangeId)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can approve exchanges'
            ], 403);
        }

        $validated = $request->validate([
            'resi_pengiriman' => 'nullable|string|max:100',
            'catatan_admin' => 'nullable|string|max:500',
        ]);

        $exchange = PenukaranProduk::where('penukaran_produk_id', $exchangeId)->firstOrFail();

        if ($exchange->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only pending exchanges can be approved',
                'current_status' => $exchange->status
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Verify product is in stock
            $product = Produk::find($exchange->produk_id);
            if (!$product || $product->stok < $exchange->jumlah) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Product out of stock',
                    'available_stock' => $product->stok ?? 0,
                    'requested_quantity' => $exchange->jumlah
                ], 400);
            }

            // Store old data for audit
            $oldData = $exchange->toArray();

            // Update exchange status
            $updateData = [
                'status' => 'approved',
                'tanggal_diambil' => now(),
            ];

            if ($validated['resi_pengiriman'] ?? null) {
                $updateData['catatan'] = 'Resi: ' . $validated['resi_pengiriman'];
            }

            $exchange->update($updateData);

            // Poin sudah dikurangi saat submit, tidak perlu decrement lagi
            $user = $exchange->user;

            $product->decrement('stok', $exchange->jumlah);

            // Create audit log
            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'approve',
                'resource_type' => 'PenukaranProduk',
                'resource_id' => $exchange->penukaran_produk_id,
                'old_values' => [
                    'status' => $oldData['status'],
                    'poin_digunakan' => $oldData['poin_digunakan'],
                ],
                'new_values' => [
                    'status' => 'approved',
                    'resi_pengiriman' => $validated['resi_pengiriman'] ?? null,
                ],
                'reason' => 'Admin approval with shipping details',
            ]);

            DB::commit();

            // Auto create notification for user
            Notifikasi::create([
                'user_id' => $exchange->user_id,
                'judul' => 'Penukaran Produk Disetujui ✅',
                'pesan' => "Penukaran produk \"{$exchange->nama_produk}\" telah disetujui." . ($validated['resi_pengiriman'] ?? null ? " Resi: {$validated['resi_pengiriman']}" : " Silakan ambil produk Anda."),
                'tipe' => 'success',
                'related_id' => $exchange->penukaran_produk_id,
                'related_type' => 'penukaran_produk',
                'is_read' => false,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Exchange approved successfully',
                'data' => [
                    'id' => $exchange->penukaran_produk_id,
                    'status' => $exchange->status,
                    'resi_pengiriman' => $validated['resi_pengiriman'] ?? null,
                    'approved_at' => $exchange->updated_at,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve exchange',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark exchange as completed (product picked up/delivered)
     * PATCH /api/admin/penukar-produk/{exchangeId}/complete
     */
    public function complete(Request $request, $exchangeId)
    {
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can complete exchanges'
            ], 403);
        }

        $validated = $request->validate([
            'catatan' => 'nullable|string|max:500',
        ]);

        DB::beginTransaction();
        try {
            $exchange = PenukaranProduk::where('penukaran_produk_id', (int) $exchangeId)
                ->lockForUpdate()
                ->firstOrFail();

            $completableStatuses = ['approved', 'diproses', 'dikirim'];
            if (!in_array($exchange->status, $completableStatuses)) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Penukaran dengan status "' . $exchange->status . '" tidak dapat diselesaikan',
                    'current_status' => $exchange->status,
                    'allowed_statuses' => $completableStatuses
                ], 400);
            }

            $oldStatus = $exchange->status;
            $penukaranId = (int) $exchange->penukaran_produk_id;
            $userId = (int) $exchange->user_id;
            $namaProduk = $exchange->nama_produk;

            $exchange->update([
                'status' => 'completed',
                'tanggal_diambil' => now(),
                'catatan' => $validated['catatan'] ?? $exchange->catatan,
            ]);

            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'complete',
                'resource_type' => 'PenukaranProduk',
                'resource_id' => $penukaranId,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'completed', 'tanggal_diambil' => now()->toISOString()],
                'reason' => 'Product picked up/delivered',
            ]);

            DB::commit();

            Notifikasi::create([
                'user_id' => $userId,
                'judul' => 'Penukaran Produk Selesai 🎉',
                'pesan' => "Penukaran produk \"{$namaProduk}\" telah selesai. Terima kasih telah menggunakan layanan kami!",
                'tipe' => 'success',
                'related_id' => $penukaranId,
                'related_type' => 'penukaran_produk',
                'is_read' => false,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Exchange completed successfully',
                'data' => [
                    'id' => $penukaranId,
                    'status' => 'completed',
                    'tanggal_diambil' => $exchange->tanggal_diambil,
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Exchange not found'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to complete exchange', [
                'exchange_id' => $exchangeId,
                'error' => $e->getMessage()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to complete exchange: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject product exchange
     * PATCH /api/admin/penukar-produk/{exchangeId}/reject
     */
    public function reject(Request $request, $exchangeId)
    {
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can reject exchanges'
            ], 403);
        }

        $alasanPenolakan = $request->input('alasan_penolakan')
                        ?? $request->input('alasan')
                        ?? $request->input('catatan_admin')
                        ?? $request->input('reason')
                        ?? $request->input('rejection_reason')
                        ?? null;

        if (!$alasanPenolakan || !is_string($alasanPenolakan)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alasan penolakan wajib diisi',
                'errors' => [
                    'alasan_penolakan' => ['The alasan penolakan field is required.']
                ]
            ], 422);
        }

        if (strlen($alasanPenolakan) > 500) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alasan penolakan maksimal 500 karakter',
                'errors' => [
                    'alasan_penolakan' => ['The alasan penolakan must not exceed 500 characters.']
                ]
            ], 422);
        }

        DB::beginTransaction();
        try {
            $exchange = PenukaranProduk::where('penukaran_produk_id', (int) $exchangeId)
                ->lockForUpdate()
                ->firstOrFail();

            $rejectableStatuses = ['pending', 'approved', 'diproses', 'dikirim'];
            if (!in_array($exchange->status, $rejectableStatuses)) {
                DB::rollBack();
                return response()->json([
                    'status' => 'error',
                    'message' => 'Penukaran dengan status "' . $exchange->status . '" tidak dapat ditolak',
                    'current_status' => $exchange->status,
                    'allowed_statuses' => $rejectableStatuses
                ], 400);
            }

            $oldStatus = $exchange->status;
            $wasApproved = in_array($oldStatus, ['approved', 'diproses', 'dikirim']);
            $userId = (int) $exchange->user_id;
            $poinDigunakan = (int) $exchange->poin_digunakan;
            $penukaranId = (int) $exchange->penukaran_produk_id;
            $namaProduk = $exchange->nama_produk;

            \Log::info('Processing exchange rejection', [
                'exchange_id' => $penukaranId,
                'user_id' => $userId,
                'poin_digunakan' => $poinDigunakan,
                'old_status' => $oldStatus,
            ]);

            PointService::refundRedemptionPoints(
                $userId,
                $poinDigunakan,
                $penukaranId
            );

            if ($wasApproved) {
                $product = Produk::find($exchange->produk_id);
                if ($product) {
                    $product->increment('stok', $exchange->jumlah);
                }
            }

            $exchange->update([
                'status' => 'cancelled',
                'catatan' => $alasanPenolakan,
            ]);

            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'reject',
                'resource_type' => 'PenukaranProduk',
                'resource_id' => $penukaranId,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'cancelled', 'reason' => $alasanPenolakan, 'points_refunded' => $poinDigunakan],
                'reason' => $alasanPenolakan,
            ]);

            DB::commit();

            Notifikasi::create([
                'user_id' => $userId,
                'judul' => 'Penukaran Produk Ditolak ❌',
                'pesan' => "Penukaran produk \"{$namaProduk}\" ditolak. Alasan: {$alasanPenolakan}. Poin sebesar {$poinDigunakan} telah dikembalikan ke saldo Anda.",
                'tipe' => 'warning',
                'related_id' => $penukaranId,
                'related_type' => 'penukaran_produk',
                'is_read' => false,
            ]);

            $user = User::find($userId);

            \Log::info('Exchange rejection completed', [
                'exchange_id' => $penukaranId,
                'user_id' => $userId,
                'points_refunded' => $poinDigunakan,
                'user_actual_poin_after' => $user->actual_poin ?? 0,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Exchange rejected successfully',
                'data' => [
                    'id' => $penukaranId,
                    'status' => 'cancelled',
                    'alasan_penolakan' => $alasanPenolakan,
                    'points_refunded' => $poinDigunakan,
                    'user_actual_poin' => $user->actual_poin ?? 0,
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Exchange not found'
            ], 404);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to reject exchange', [
                'exchange_id' => $exchangeId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reject exchange: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete product exchange (only pending)
     * DELETE /api/admin/penukar-produk/{exchangeId}
     */
    public function destroy(Request $request, $exchangeId)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can delete exchanges'
            ], 403);
        }

        $exchange = PenukaranProduk::where('penukaran_produk_id', $exchangeId)->firstOrFail();

        if ($exchange->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'Only pending exchanges can be deleted',
                'current_status' => $exchange->status
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Store old data for audit
            $oldData = $exchange->toArray();

            // Create audit log before deletion
            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'delete',
                'resource_type' => 'PenukaranProduk',
                'resource_id' => $exchange->penukaran_produk_id,
                'old_values' => $oldData,
                'new_values' => ['deleted' => true],
                'reason' => 'Admin deletion of pending exchange',
            ]);

            // Delete the exchange
            $exchange->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Exchange deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete exchange',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product exchange statistics
     * GET /api/admin/penukar-produk/stats/overview
     */
    public function stats(Request $request)
    {
        // RBAC: Admin+ only - Check if user is admin or superadmin
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can view statistics'
            ], 403);
        }

        // Get date range from request
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = PenukaranProduk::query();

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        // Calculate statistics
        $totalPending = (clone $query)->where('status', 'pending')->count();
        $totalApproved = (clone $query)->where('status', 'approved')->count();
        $totalRejected = (clone $query)->where('status', 'rejected')->count();

        $totalPointsUsed = (clone $query)->sum('poin_digunakan');

        // Get most exchanged product
        $mostExchanged = PenukaranProduk::where('status', 'approved')
            ->select('produk_id', 'nama_produk')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('produk_id', 'nama_produk')
            ->orderBy('count', 'desc')
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_pending' => $totalPending,
                'total_approved' => $totalApproved,
                'total_rejected' => $totalRejected,
                'total_points_used' => (int) $totalPointsUsed,
                'most_exchanged_product' => $mostExchanged ? [
                    'id' => $mostExchanged->produk_id,
                    'nama' => $mostExchanged->nama_produk,
                    'count' => (int) $mostExchanged->count,
                ] : null,
            ]
        ]);
    }
}
