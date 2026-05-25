<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\TabungSampah;
use App\Http\Resources\UserResource;
use App\Http\Resources\TabungSampahResource;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserController extends Controller
{
    public function show(Request $request, $id)
    {
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $user = User::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => new UserResource($user),
        ]);
    }

    public function update(Request $request, $id)
    {
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id . ',user_id',
            'no_hp' => 'sometimes|string|max:20',
            'alamat' => 'sometimes|string',
        ]);

        $user = User::findOrFail($id);
        $user->update($request->only(['nama', 'email', 'no_hp', 'alamat']));

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => new UserResource($user),
        ]);
    }

    public function updatePhoto(Request $request, $id)
    {
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        // Log upload attempt for debugging camera issues
        if ($request->hasFile('foto_profil')) {
            $file = $request->file('foto_profil');
            \Log::info('Profile photo upload attempt', [
                'user_id' => $id,
                'file_size_bytes' => $file->getSize(),
                'file_size_mb' => round($file->getSize() / 1024 / 1024, 2) . ' MB',
                'file_type' => $file->getMimeType(),
                'file_extension' => $file->getClientOriginalExtension(),
                'guessed_extension' => $file->guessExtension(),
                'original_name' => $file->getClientOriginalName(),
                'is_valid' => $file->isValid(),
                'error' => $file->getError(),
            ]);
        }

        // Validate file with more lenient check for camera photos
        if (!$request->hasFile('foto_profil')) {
            return response()->json([
                'status' => 'error',
                'message' => 'Foto profil harus diupload',
            ], 422);
        }

        $file = $request->file('foto_profil');

        // Check if file is valid
        if (!$file->isValid()) {
            $errorMessage = $this->getUploadErrorMessage($file->getError());
            \Log::error('Invalid profile photo upload', [
                'error_code' => $file->getError(),
                'error_message' => $errorMessage,
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'File upload gagal: ' . $errorMessage,
            ], 422);
        }

        // Check file size (max 2MB for profile photos)
        if ($file->getSize() > 2 * 1024 * 1024) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ukuran file maksimal 2MB',
            ], 422);
        }

        // More lenient MIME type check for camera photos
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/octet-stream'];
        $mimeType = $file->getMimeType();

        // If MIME is octet-stream, try to detect from extension
        if ($mimeType === 'application/octet-stream') {
            $extension = strtolower($file->getClientOriginalExtension());
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
                \Log::info('Camera profile photo detected with octet-stream mime, allowing based on extension', [
                    'extension' => $extension
                ]);
            } else {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Format file harus JPG, JPEG, PNG, atau GIF',
                ], 422);
            }
        } elseif (!in_array($mimeType, $allowedMimes)) {
            // Additional check: verify it's actually an image by reading file header
            $imageInfo = @getimagesize($file->getRealPath());
            if ($imageInfo === false) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Format file harus berupa gambar (JPG, JPEG, PNG, atau GIF)',
                ], 422);
            }
            \Log::info('Profile photo passed getimagesize check despite MIME mismatch', [
                'detected_mime' => $mimeType,
                'image_type' => $imageInfo[2] ?? 'unknown',
            ]);
        }

        $user = User::findOrFail($id);
        $cloudinaryService = new CloudinaryService();

        // Upload to Cloudinary
        $uploadResult = $cloudinaryService->uploadImage($file, 'profiles');

        if (!$uploadResult['success']) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to upload image: ' . $uploadResult['error']
            ], 500);
        }

        // Delete old photo from Cloudinary if exists
        if ($user->foto_profil_public_id) {
            $cloudinaryService->deleteImage($user->foto_profil_public_id);
        }

        // Update user with new photo URL and public_id
        $user->update([
            'foto_profil' => $uploadResult['url'],
            'foto_profil_public_id' => $uploadResult['public_id']
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Photo updated successfully',
            'data' => new UserResource($user),
        ]);
    }

    // Get upload error message
    private function getUploadErrorMessage($errorCode)
    {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'File terlalu besar (melebihi limit server)',
            UPLOAD_ERR_FORM_SIZE => 'File terlalu besar (melebihi limit form)',
            UPLOAD_ERR_PARTIAL => 'File hanya terupload sebagian',
            UPLOAD_ERR_NO_FILE => 'Tidak ada file yang diupload',
            UPLOAD_ERR_NO_TMP_DIR => 'Server error: temporary folder tidak ditemukan',
            UPLOAD_ERR_CANT_WRITE => 'Server error: gagal menulis file',
            UPLOAD_ERR_EXTENSION => 'Upload dihentikan oleh extension',
        ];
        return $errors[$errorCode] ?? 'Unknown upload error';
    }

    // POST /api/users/{id}/avatar
    public function uploadAvatar(Request $request, $id)
    {
        // RBAC: User can only upload own avatar, Admin can upload for users
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id && !$currentUser->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to upload avatar for this user'
            ], 403);
        }

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,jpg,png,gif|max:2048',
        ]);

        $user = User::findOrFail($id);

        // Delete old avatar if exists
        if ($user->foto_profil) {
            Storage::disk('public')->delete($user->foto_profil);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['foto_profil' => $path]);

        // Log the action
        if ($currentUser->isAdminUser()) {
            \App\Models\AuditLog::create([
                'admin_id' => $currentUser->user_id,
                'action_type' => 'upload_user_avatar',
                'resource_type' => 'User',
                'resource_id' => $id,
                'old_values' => ['foto_profil' => $user->getOriginal('foto_profil')],
                'new_values' => ['foto_profil' => $path],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'status' => 'success'
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Avatar uploaded successfully',
            'data' => [
                'foto_profil' => $path,
                'url' => asset('storage/' . $path)
            ]
        ], 200);
    }

    // GET /api/users/{id}/tabung-sampah
    public function tabungSampahHistory(Request $request, $id)
    {
        // IDOR Protection
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden: Cannot access other user\'s data'
            ], 403);
        }

        $history = TabungSampah::where('user_id', $id)
            ->with('jadwal')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => TabungSampahResource::collection($history),
        ]);
    }

    public function badges(Request $request, $id)
    {
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $user = User::findOrFail($id);

        // Get badges through the many-to-many relationship
        $badges = $user->badges()
            ->withPivot('tanggal_dapat')
            ->orderBy('user_badges.tanggal_dapat', 'desc')
            ->get()
            ->map(function($badge) {
                return [
                    'badge_id' => $badge->badge_id,
                    'nama' => $badge->nama,
                    'deskripsi' => $badge->deskripsi,
                    'icon' => $badge->icon,
                    'syarat_poin' => $badge->syarat_poin,
                    'syarat_setor' => $badge->syarat_setor,
                    'tipe' => $badge->tipe,
                    'tanggal_dapat' => $badge->pivot->tanggal_dapat,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $badges,
        ]);
    }

    public function aktivitas(Request $request, $id)
    {
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        // Verify user exists
        User::findOrFail($id);

        $limit = min($request->query('limit', 20), 100); // Max 100 activities

        $aktivitas = DB::table('log_aktivitas')
            ->where('user_id', $id)
            ->orderBy('tanggal', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function($activity) {
                return [
                    'log_user_activity_id' => $activity->log_user_activity_id,
                    'tipe_aktivitas' => $activity->tipe_aktivitas,
                    'deskripsi' => $activity->deskripsi,
                    'poin_perubahan' => (int) $activity->poin_perubahan,
                    'tanggal' => $activity->tanggal,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $aktivitas,
        ]);
    }

    // GET /api/users/{id}/point-history
    public function pointHistory(Request $request, $id)
    {
        // IDOR Protection - Users can only see their own history, Admin can see all
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id && !$currentUser->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view this user\'s point history'
            ], 403);
        }

        $perPage = min($request->get('per_page', 10), 100);
        $page = $request->get('page', 1);

        // Get point history from poin_transaksis or log_aktivitas
        $history = DB::table('log_aktivitas')
            ->where('user_id', $id)
            ->whereNotNull('poin_perubahan')
            ->select(
                'log_user_activity_id as id',
                'tipe_aktivitas as type',
                'deskripsi as alasan',
                DB::raw('poin_perubahan as poin_change'),
                DB::raw('0 as poin_sebelum'),
                DB::raw('0 as poin_sesudah'),
                'created_at'
            )
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'status' => 'success',
            'data' => $history->map(function ($item) {
                return [
                    'id' => $item->id,
                    'user_id' => auth()->id(),
                    'type' => $item->type,
                    'poin_change' => (int) $item->poin_change,
                    'poin_sebelum' => (int) $item->poin_sebelum,
                    'poin_sesudah' => (int) $item->poin_sesudah,
                    'alasan' => $item->alasan,
                    'created_at' => $item->created_at,
                ];
            }),
            'pagination' => [
                'current_page' => $history->currentPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
                'last_page' => $history->lastPage(),
            ]
        ]);
    }

    // GET /api/users/{id}/redeem-history
    public function redeemHistory(Request $request, $id)
    {
        // IDOR Protection
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id && !$currentUser->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view this user\'s redemption history'
            ], 403);
        }

        $status = $request->get('status');
        $perPage = min($request->get('per_page', 10), 100);
        $page = $request->get('page', 1);

        $query = DB::table('penukaran_produk')
            ->where('user_id', $id)
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $redemptions = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'status' => 'success',
            'data' => $redemptions->map(function ($redemption) {
                return [
                    'id' => $redemption->penukaran_produk_id ?? $redemption->id,
                    'user_id' => $redemption->user_id,
                    'product_id' => $redemption->produk_id,
                    'product' => [
                        'id' => $redemption->produk_id,
                        'foto' => $redemption->foto ?? null,
                    ],
                    'poin_digunakan' => (int) $redemption->poin_digunakan,
                    'status' => $redemption->status,
                    'resi_pengiriman' => $redemption->catatan ?? null,
                    'created_at' => $redemption->created_at,
                ];
            }),
            'pagination' => [
                'current_page' => $redemptions->currentPage(),
                'per_page' => $redemptions->perPage(),
                'total' => $redemptions->total(),
                'last_page' => $redemptions->lastPage(),
            ]
        ]);
    }

    // GET /api/users/{id}/waste-deposits
    public function wasteDepositHistory(Request $request, $id)
    {
        // IDOR Protection
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id && !$currentUser->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view this user\'s deposit history'
            ], 403);
        }

        $status = $request->get('status');
        $perPage = min($request->get('per_page', 10), 100);
        $page = $request->get('page', 1);

        $query = TabungSampah::where('user_id', $id)
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $deposits = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'status' => 'success',
            'data' => $deposits->map(function ($deposit) {
                return [
                    'id' => $deposit->tabung_sampah_id,
                    'user_id' => $deposit->user_id,
                    'berat_kg' => (float) $deposit->berat_kg,
                    'foto_sampah' => $deposit->foto_sampah,
                    'jenis_sampah' => $deposit->jenis_sampah,
                    'status' => $deposit->status,
                    'poin_didapat' => (int) ($deposit->poin_didapat ?? 0),
                    'created_at' => $deposit->created_at,
                ];
            }),
            'pagination' => [
                'current_page' => $deposits->currentPage(),
                'per_page' => $deposits->perPage(),
                'total' => $deposits->total(),
                'last_page' => $deposits->lastPage(),
            ]
        ]);
    }

    // GET /api/users/{id}/dashboard/points
    public function dashboardPoints(Request $request, $id)
    {
        // IDOR Protection
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view this dashboard'
            ], 403);
        }

        $user = User::findOrFail($id);

        // Get current month
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        // Points earned this month
        $poinEarnedThisMonth = DB::table('log_aktivitas')
            ->where('user_id', $id)
            ->whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('poin_perubahan', '>', 0)
            ->sum('poin_perubahan');

        // Points earned this year
        $yearStart = Carbon::now()->startOfYear();
        $yearEnd = Carbon::now()->endOfYear();
        $poinEarnedThisYear = DB::table('log_aktivitas')
            ->where('user_id', $id)
            ->whereBetween('created_at', [$yearStart, $yearEnd])
            ->where('poin_perubahan', '>', 0)
            ->sum('poin_perubahan');

        // Recent activities
        $recentActivities = DB::table('log_aktivitas')
            ->where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->log_user_activity_id,
                    'type' => $activity->tipe_aktivitas,
                    'description' => $activity->deskripsi,
                    'poin_change' => (int) $activity->poin_perubahan,
                    'created_at' => $activity->created_at,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'poin_saat_ini' => (int) $user->actual_poin,
                'poin_earned_bulan_ini' => (int) $poinEarnedThisMonth,
                'poin_earned_tahun_ini' => (int) $poinEarnedThisYear,
                'recent_activities' => $recentActivities,
            ]
        ]);
    }

    // GET /api/users/{id}/badge-title
    public function getBadgeTitle(Request $request, $id)
    {
        // IDOR Protection - Any user can see another user's badge title (for public profile)
        $user = User::with('badgeTitle')->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => [
                'badge_title_id' => $user->badge_title_id,
                'badge_title' => $user->badgeTitle ? [
                    'badge_id' => $user->badgeTitle->badge_id,
                    'nama' => $user->badgeTitle->nama,
                    'deskripsi' => $user->badgeTitle->deskripsi,
                    'icon' => $user->badgeTitle->icon,
                ] : null,
            ]
        ]);
    }

    // PUT /api/users/{id}/badge-title
    public function setBadgeTitle(Request $request, $id)
    {
        // IDOR Protection - Only owner can set their own badge title
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to set badge title for this user'
            ], 403);
        }

        $request->validate([
            'badge_id' => 'nullable|integer',
        ]);

        $user = User::findOrFail($id);
        $badgeId = $request->input('badge_id');

        // If badge_id is provided, verify user has unlocked this badge
        if ($badgeId) {
            $hasUnlockedBadge = $user->badges()
                ->where('badges.badge_id', $badgeId)
                ->exists();

            if (!$hasUnlockedBadge) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda belum membuka badge ini. Hanya badge yang sudah diklaim yang dapat dijadikan title.'
                ], 400);
            }
        }

        // Update badge title
        $user->update(['badge_title_id' => $badgeId]);
        $user->load('badgeTitle');

        return response()->json([
            'status' => 'success',
            'message' => $badgeId ? 'Badge title berhasil diatur' : 'Badge title berhasil dihapus',
            'data' => [
                'badge_title_id' => $user->badge_title_id,
                'badge_title' => $user->badgeTitle ? [
                    'badge_id' => $user->badgeTitle->badge_id,
                    'nama' => $user->badgeTitle->nama,
                    'deskripsi' => $user->badgeTitle->deskripsi,
                    'icon' => $user->badgeTitle->icon,
                ] : null,
            ]
        ]);
    }

    // GET /api/users/{id}/badges-list
    public function badgesList(Request $request, $id)
    {
        // IDOR Protection - Only owner can see their unlocked badges list
        $currentUser = $request->user();
        if ((int)$currentUser->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized to view badges for this user'
            ], 403);
        }

        $user = User::findOrFail($id);

        // Get all unlocked badges
        $unlockedBadges = $user->badges()
            ->orderBy('user_badges.tanggal_dapat', 'desc')
            ->get()
            ->map(function ($badge) {
                return [
                    'badge_id' => $badge->badge_id,
                    'nama' => $badge->nama,
                    'deskripsi' => $badge->deskripsi,
                    'icon' => $badge->icon,
                    'reward_poin' => $badge->reward_poin,
                    'tipe' => $badge->tipe,
                    'tanggal_dapat' => $badge->pivot->tanggal_dapat,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'unlocked_badges' => $unlockedBadges,
                'count' => $unlockedBadges->count(),
                'current_badge_title_id' => $user->badge_title_id,
            ]
        ]);
    }
}
