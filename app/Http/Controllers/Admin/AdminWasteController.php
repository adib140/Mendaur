<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TabungSampah;
use App\Models\User;
use App\Models\AuditLog;
use App\Models\LogAktivitas;
use App\Models\Notifikasi;
use App\Services\PointService;
use Illuminate\Database\Eloquent\Builder;

class AdminWasteController extends Controller
{
    // GET /api/admin/penyetoran-sampah
    public function index(Request $request)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can view waste deposits'
            ], 403);
        }

        $query = TabungSampah::query();

        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Filter by jenis_sampah
        if ($request->has('jenis_sampah') && $request->jenis_sampah) {
            $query->where('jenis_sampah', 'like', '%' . $request->jenis_sampah . '%');
        }

        // Search
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function (Builder $q) use ($searchTerm) {
                $q->where('nama_lengkap', 'like', '%' . $searchTerm . '%')
                  ->orWhere('no_hp', 'like', '%' . $searchTerm . '%');
            })->orWhereHas('user', function (Builder $q) use ($searchTerm) {
                $q->where('nama', 'like', '%' . $searchTerm . '%')
                  ->orWhere('email', 'like', '%' . $searchTerm . '%');
            });
        }

        // Filter by date
        if ($request->has('from_date') && $request->from_date) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date') && $request->to_date) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = min($request->get('per_page', 10), 100);
        $deposits = $query->with('user')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $deposits->map(function ($deposit) {
                // Hitung poin_pending
                $poinPending = ($deposit->status === 'pending') ? intval($deposit->berat_kg * 10) : 0;

                return [
                    'id' => $deposit->tabung_sampah_id,
                    'tabung_sampah_id' => $deposit->tabung_sampah_id,
                    'user_id' => $deposit->user_id,
                    'user_name' => $deposit->nama_lengkap,
                    'user_email' => $deposit->user?->email ?? '',
                    'nama_lengkap' => $deposit->nama_lengkap,
                    'no_hp' => $deposit->no_hp,
                    'jenis_sampah' => $deposit->jenis_sampah,
                    'berat' => (float) $deposit->berat_kg,
                    'berat_kg' => (float) $deposit->berat_kg,
                    'status' => $deposit->status,
                    'poin_pending' => $poinPending,
                    'poin_didapat' => $deposit->poin_didapat ?? 0,
                    'foto_bukti' => $deposit->foto_sampah,
                    'foto_sampah' => $deposit->foto_sampah,
                    'titik_lokasi' => $deposit->titik_lokasi,
                    'jadwal' => $deposit->jadwal_penyetoran_id ?? 'Jadwal tidak diatur',
                    'created_at' => $deposit->created_at,
                    'updated_at' => $deposit->updated_at,
                    'user' => $deposit->user ? [
                        'user_id' => $deposit->user->user_id,
                        'nama' => $deposit->user->nama,
                        'email' => $deposit->user->email,
                    ] : null
                ];
            }),
            'pagination' => [
                'total' => $deposits->total(),
                'count' => $deposits->count(),
                'per_page' => $deposits->perPage(),
                'current_page' => $deposits->currentPage(),
                'last_page' => $deposits->lastPage(),
            ]
        ], 200);
    }

    // GET /api/admin/penyetoran-sampah/{id}
    public function show(Request $request, $id)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can view waste deposits'
            ], 403);
        }

        $deposit = TabungSampah::with('user')->findOrFail($id);

        $poinPending = ($deposit->status === 'pending') ? intval($deposit->berat_kg * 10) : 0;

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $deposit->tabung_sampah_id,
                'tabung_sampah_id' => $deposit->tabung_sampah_id,
                'user_id' => $deposit->user_id,
                'user_name' => $deposit->nama_lengkap,
                'user_email' => $deposit->user?->email ?? '',
                'nama_lengkap' => $deposit->nama_lengkap,
                'no_hp' => $deposit->no_hp,
                'jenis_sampah' => $deposit->jenis_sampah,
                'berat' => (float) $deposit->berat_kg,
                'berat_kg' => (float) $deposit->berat_kg,
                'status' => $deposit->status,
                'poin_pending' => $poinPending,
                'poin_didapat' => $deposit->poin_didapat ?? 0,
                'foto_bukti' => $deposit->foto_sampah,
                'foto_sampah' => $deposit->foto_sampah,
                'titik_lokasi' => $deposit->titik_lokasi,
                'jadwal' => $deposit->jadwal_penyetoran_id ?? 'Jadwal tidak diatur',
                'created_at' => $deposit->created_at,
                'updated_at' => $deposit->updated_at,
                'user' => $deposit->user ? [
                    'user_id' => $deposit->user->user_id,
                    'nama' => $deposit->user->nama,
                    'email' => $deposit->user->email,
                ] : null
            ]
        ], 200);
    }

    // PATCH /api/admin/penyetoran-sampah/{id}/approve
    public function approve(Request $request, $id)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can approve deposits'
            ], 403);
        }

        $request->validate([
            'poin_diberikan' => 'required|integer|min:1|max:10000',
        ]);

        $deposit = TabungSampah::findOrFail($id);

            // Check if already approved
            if ($deposit->status === 'approved') {
            return response()->json([
                'status' => 'error',
                'message' => 'This deposit has already been approved'
            ], 422);
            }

            $user = User::findOrFail($deposit->user_id);

        try {
            $oldData = $deposit->replicate()->toArray();

            $deposit->update([
                'status' => 'approved',
                'poin_didapat' => $request->poin_diberikan,
            ]);

            // Tambah poin: actual_poin + display_poin
            PointService::earnPoints(
                $user->user_id,
                $request->poin_diberikan,
                'admin_approve_deposit',
                'Poin dari persetujuan penyetoran sampah oleh admin',
                null,
                $deposit->tabung_sampah_id,
                'TabungSampah'
            );

            // Audit log
            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'approve',
                'resource_type' => 'TabungSampah',
                'resource_id' => $id,
                'old_values' => [
                    'status' => $oldData['status'] ?? 'pending',
                    'poin_didapat' => $oldData['poin_didapat'] ?? 0
                ],
                'new_values' => [
                    'status' => 'approved',
                    'poin_didapat' => $request->poin_diberikan
                ],
                'reason' => $request->input('notes', '')
            ]);

            // Log aktivitas user
            LogAktivitas::create([
                'user_id' => $deposit->user_id,
                'tipe_aktivitas' => 'penyetoran_disetujui',
                'deskripsi' => 'Penyetoran sampah ' . $deposit->berat_kg . 'kg telah disetujui',
                'poin_perubahan' => $request->poin_diberikan,
                'tanggal' => now(),
            ]);

            // Auto create notification for user
            Notifikasi::create([
                'user_id' => $deposit->user_id,
                'judul' => 'Penyetoran Sampah Disetujui ✅',
                'pesan' => "Penyetoran sampah Anda seberat {$deposit->berat_kg} kg telah disetujui. Anda mendapatkan {$request->poin_diberikan} poin!",
                'tipe' => 'success',
                'related_id' => $deposit->tabung_sampah_id,
                'related_type' => 'penyetoran_sampah',
                'is_read' => false,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Deposit approved successfully',
                'data' => [
                    'tabung_sampah_id' => $deposit->tabung_sampah_id,
                    'status' => $deposit->status,
                    'poin_diberikan' => $deposit->poin_didapat,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to approve deposit: ' . $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/admin/penyetoran-sampah/{id}/reject
    public function reject(Request $request, $id)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can reject deposits'
            ], 403);
        }

        $request->validate([
            'alasan_penolakan' => 'required|string|max:500',
        ]);

        $deposit = TabungSampah::findOrFail($id);

        // Check if already rejected
        if ($deposit->status === 'rejected') {
            return response()->json([
                'status' => 'error',
                'message' => 'This deposit has already been rejected'
            ], 422);
        }

        try {
            // Update deposit with rejection reason
            $oldData = $deposit->replicate()->toArray();

            $deposit->update([
                'status' => 'rejected',
                'poin_didapat' => 0,
            ]);

            // Audit log
            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'reject',
                'resource_type' => 'TabungSampah',
                'resource_id' => $id,
                'old_values' => [
                    'status' => $oldData['status'] ?? 'pending',
                    'poin_didapat' => $oldData['poin_didapat'] ?? 0
                ],
                'new_values' => [
                    'status' => 'rejected',
                    'poin_didapat' => 0
                ],
                'reason' => $request->alasan_penolakan
            ]);

            // Log aktivitas user
            LogAktivitas::create([
                'user_id' => $deposit->user_id,
                'tipe_aktivitas' => 'penyetoran_ditolak',
                'deskripsi' => 'Penyetoran sampah ditolak. Alasan: ' . $request->alasan_penolakan,
                'poin_perubahan' => 0,
                'tanggal' => now(),
            ]);

            // Auto notifikasi
            Notifikasi::create([
                'user_id' => $deposit->user_id,
                'judul' => 'Penyetoran Sampah Ditolak ❌',
                'pesan' => "Penyetoran sampah Anda seberat {$deposit->berat_kg} kg ditolak. Alasan: {$request->alasan_penolakan}",
                'tipe' => 'warning',
                'related_id' => $deposit->tabung_sampah_id,
                'related_type' => 'penyetoran_sampah',
                'is_read' => false,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Deposit rejected successfully',
                'data' => [
                    'tabung_sampah_id' => $deposit->tabung_sampah_id,
                    'status' => $deposit->status,
                    'alasan_penolakan' => $request->alasan_penolakan,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reject deposit: ' . $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/penyetoran-sampah/{id}
    public function destroy(Request $request, $id)
    {
        // RBAC: Superadmin only
        if (!$request->user()->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only superadmins can delete deposits'
            ], 403);
        }

        $deposit = TabungSampah::findOrFail($id);

        try {
            $oldData = $deposit->replicate()->toArray();

            // Log action in audit_logs
            AuditLog::create([
                'admin_id' => $request->user()->user_id,
                'action_type' => 'delete',
                'resource_type' => 'TabungSampah',
                'resource_id' => $id,
                'old_values' => $oldData,
                'new_values' => null,
                'reason' => 'Deposit deleted by superadmin'
            ]);

            $deposit->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Deposit deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete deposit: ' . $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/penyetoran-sampah/stats/overview
    public function stats(Request $request)
    {
        // RBAC: Admin+ only
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can view statistics'
            ], 403);
        }

        $totalDeposits = TabungSampah::count();
        $approvedDeposits = TabungSampah::where('status', 'approved')->count();
        $pendingDeposits = TabungSampah::where('status', 'pending')->count();
        $rejectedDeposits = TabungSampah::where('status', 'rejected')->count();

        $totalWeight = TabungSampah::where('status', 'approved')->sum('berat_kg');
        $totalPointsAwarded = TabungSampah::where('status', 'approved')->sum('poin_didapat');

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_deposits' => $totalDeposits,
                'approved_deposits' => $approvedDeposits,
                'pending_deposits' => $pendingDeposits,
                'rejected_deposits' => $rejectedDeposits,
                'total_weight_kg' => (float) $totalWeight,
                'total_points_awarded' => (int) $totalPointsAwarded,
            ]
        ], 200);
    }
}
