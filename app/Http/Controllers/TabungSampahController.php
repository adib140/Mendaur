<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TabungSampah;
use App\Models\User;
use App\Models\LogAktivitas;
use App\Services\BadgeService;
use App\Services\PointService;
use App\Services\CloudinaryService;
use App\Http\Resources\TabungSampahResource;

class TabungSampahController extends Controller
{
    protected $badgeService;

    public function __construct(BadgeService $badgeService)
    {
        $this->badgeService = $badgeService;
    }
    // List all tabung sampah
    public function index()
    {
        $data = TabungSampah::with(['user', 'jadwal'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => TabungSampahResource::collection($data)
        ]);
    }

    // Create new tabung sampah
    public function store(Request $request)
    {
        // Log upload attempt for debugging
        if ($request->hasFile('foto_sampah')) {
            $file = $request->file('foto_sampah');
            \Log::info('Image upload attempt - TabungSampah store', [
                'user_id' => $request->user_id,
                'file_size_bytes' => $file->getSize(),
                'file_size_mb' => round($file->getSize() / 1024 / 1024, 2) . ' MB',
                'file_type' => $file->getMimeType(),
                'file_extension' => $file->getClientOriginalExtension(),
                'guessed_extension' => $file->guessExtension(),
                'original_name' => $file->getClientOriginalName(),
                'is_valid' => $file->isValid(),
                'error' => $file->getError(),
                'real_path' => $file->getRealPath(),
            ]);
        }

        // Custom validation - more lenient for camera photos
        $rules = [
            'user_id' => 'required|exists:users,user_id',
            'jadwal_penyetoran_id' => 'required|exists:jadwal_penyetorans,jadwal_penyetoran_id',
            'nama_lengkap' => 'required|string',
            'no_hp' => 'required|string',
            'titik_lokasi' => 'required|string',
            'jenis_sampah' => 'required|string',
        ];

        // Validate file manually with more lenient check for camera photos
        if ($request->hasFile('foto_sampah')) {
            $file = $request->file('foto_sampah');

            // Check if file is valid
            if (!$file->isValid()) {
                \Log::error('Invalid file upload', [
                    'error_code' => $file->getError(),
                    'error_message' => $this->getUploadErrorMessage($file->getError()),
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File upload gagal: ' . $this->getUploadErrorMessage($file->getError()),
                ], 422);
            }

            // Check file size (max 10MB)
            if ($file->getSize() > 10 * 1024 * 1024) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ukuran file maksimal 10MB',
                ], 422);
            }

            // More lenient MIME type check for camera photos
            $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/octet-stream'];
            $mimeType = $file->getMimeType();

            // If MIME is octet-stream, try to detect from extension
            if ($mimeType === 'application/octet-stream') {
                $extension = strtolower($file->getClientOriginalExtension());
                if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
                    \Log::info('Camera photo detected with octet-stream mime, allowing based on extension', [
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
                \Log::info('File passed getimagesize check despite MIME mismatch', [
                    'detected_mime' => $mimeType,
                    'image_type' => $imageInfo[2] ?? 'unknown',
                ]);
            }
        }

        $validated = $request->validate($rules);

        // Handle file upload to Cloudinary
        if ($request->hasFile('foto_sampah')) {
            $file = $request->file('foto_sampah');
            $cloudinaryService = new CloudinaryService();

            try {
                $uploadResult = $cloudinaryService->uploadImage($file, 'sampah');

                if ($uploadResult['success']) {
                    $validated['foto_sampah'] = $uploadResult['url'];
                    $validated['foto_sampah_public_id'] = $uploadResult['public_id'];

                    \Log::info('Image uploaded to Cloudinary - TabungSampah store', [
                        'user_id' => $request->user_id,
                        'cloudinary_url' => $uploadResult['url'],
                    ]);
                } else {
                    \Log::error('Cloudinary upload failed, falling back to local storage', [
                        'error' => $uploadResult['error'] ?? 'Unknown error'
                    ]);
                    // Fallback to local storage
                    $extension = $file->getClientOriginalExtension() ?: ($file->guessExtension() ?: 'jpg');
                    $filename = time() . '_' . uniqid() . '.' . $extension;
                    $path = $file->storeAs('uploads/sampah', $filename, 'public');
                    $validated['foto_sampah'] = $path;
                }
            } catch (\Exception $e) {
                \Log::error('Failed to upload image', [
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal menyimpan foto: ' . $e->getMessage(),
                ], 500);
            }
        }

        $data = TabungSampah::create($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Setor sampah berhasil!',
            'data' => new TabungSampahResource($data)
        ], 201);
    }

    // Get specific tabung sampah
    public function show(TabungSampah $tabungSampah)
    {
        return response()->json([
            'status' => 'success',
            'data' => new TabungSampahResource($tabungSampah->load(['user', 'jadwal']))
        ]);
    }

    // Update tabung sampah
    public function update(Request $request, TabungSampah $tabungSampah)
    {
        // Log upload attempt for debugging
        if ($request->hasFile('foto_sampah')) {
            $file = $request->file('foto_sampah');
            \Log::info('Image upload attempt - TabungSampah update', [
                'tabung_sampah_id' => $tabungSampah->tabung_sampah_id ?? $tabungSampah->id,
                'file_size_bytes' => $file->getSize(),
                'file_size_mb' => round($file->getSize() / 1024 / 1024, 2) . ' MB',
                'file_type' => $file->getMimeType(),
                'file_extension' => $file->getClientOriginalExtension(),
                'guessed_extension' => $file->guessExtension(),
                'original_name' => $file->getClientOriginalName(),
                'is_valid' => $file->isValid(),
                'error' => $file->getError(),
                'real_path' => $file->getRealPath(),
            ]);
        }

        // Custom validation - more lenient for camera photos
        $rules = [
            'nama_lengkap' => 'nullable|string',
            'no_hp' => 'nullable|string',
            'titik_lokasi' => 'nullable|string',
            'jenis_sampah' => 'nullable|string',
        ];

        // Validate file manually with more lenient check for camera photos
        if ($request->hasFile('foto_sampah')) {
            $file = $request->file('foto_sampah');

            // Check if file is valid
            if (!$file->isValid()) {
                \Log::error('Invalid file upload - update', [
                    'error_code' => $file->getError(),
                    'error_message' => $this->getUploadErrorMessage($file->getError()),
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'File upload gagal: ' . $this->getUploadErrorMessage($file->getError()),
                ], 422);
            }

            // Check file size (max 10MB)
            if ($file->getSize() > 10 * 1024 * 1024) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Ukuran file maksimal 10MB',
                ], 422);
            }

            // More lenient MIME type check for camera photos
            $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/octet-stream'];
            $mimeType = $file->getMimeType();

            // If MIME is octet-stream, try to detect from extension
            if ($mimeType === 'application/octet-stream') {
                $extension = strtolower($file->getClientOriginalExtension());
                if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
                    \Log::info('Camera photo detected with octet-stream mime, allowing based on extension', [
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
                \Log::info('File passed getimagesize check despite MIME mismatch', [
                    'detected_mime' => $mimeType,
                    'image_type' => $imageInfo[2] ?? 'unknown',
                ]);
            }
        }

        $validated = $request->validate($rules);

        // Handle file upload
        if ($request->hasFile('foto_sampah')) {
            $file = $request->file('foto_sampah');

            // Generate safe filename
            $extension = $file->getClientOriginalExtension() ?: ($file->guessExtension() ?: 'jpg');
            $filename = time() . '_' . uniqid() . '.' . $extension;

            try {
                $path = $file->storeAs('uploads/sampah', $filename, 'public');
                $validated['foto_sampah'] = $path;

                \Log::info('Image uploaded successfully - TabungSampah update', [
                    'tabung_sampah_id' => $tabungSampah->tabung_sampah_id ?? $tabungSampah->id,
                    'stored_path' => $path,
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to store image - update', [
                    'error' => $e->getMessage(),
                ]);
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal menyimpan foto: ' . $e->getMessage(),
                ], 500);
            }
        }

        $tabungSampah->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Data berhasil diupdate',
            'data' => new TabungSampahResource($tabungSampah)
        ]);
    }

    // Delete tabung sampah
    public function destroy(TabungSampah $tabungSampah)
    {
        $tabungSampah->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Data deleted'
        ]);
    }

    public function byUser(Request $request, $id)
    {
        if ((int)$request->user()->user_id !== (int)$id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized'
            ], 403);
        }

        $data = TabungSampah::where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => TabungSampahResource::collection($data)
        ]);
    }

    // PUT /api/admin/tabung-sampah/{id}/approve
    public function approve(Request $request, $id)
    {
        try {
            $tabungSampah = TabungSampah::findOrFail($id);

            $validated = $request->validate([
                'berat_kg' => 'required|numeric|min:0',
                'poin_didapat' => 'required|integer|min:0',
            ]);

            \Log::info("Approving tabung_sampah", [
                'tabung_sampah_id' => $id,
                'user_id' => $tabungSampah->user_id,
                'berat_kg' => $validated['berat_kg'],
                'poin_didapat' => $validated['poin_didapat'],
            ]);

            // Update status to approved
            $tabungSampah->update([
                'status' => 'approved',
                'berat_kg' => $validated['berat_kg'],
                'poin_didapat' => $validated['poin_didapat'],
            ]);

            // Use PointService to handle all point logic
            $pointCalculation = PointService::calculatePointsForDeposit($tabungSampah);
            PointService::applyDepositPoints($tabungSampah);

            // Update user statistics
            $user = User::findOrFail($tabungSampah->user_id);
            $user->increment('total_setor_sampah');

            \Log::info("User poin updated via PointService", [
                'user_id' => $user->user_id,
                'total_poin_awarded' => $pointCalculation['total'],
                'breakdown' => $pointCalculation['breakdown'],
                'new_actual_poin' => $user->fresh()->actual_poin,
            ]);

            // Log the waste deposit activity
            LogAktivitas::log(
                $user->user_id,
                LogAktivitas::TYPE_SETOR_SAMPAH,
                "Menyetor {$validated['berat_kg']}kg sampah {$tabungSampah->jenis_sampah}",
                $pointCalculation['total']
            );

            // ✨ Check for new badges and award rewards automatically
            $newBadges = $this->badgeService->checkAndAwardBadges($user->user_id);

            return response()->json([
                'status' => 'success',
                'message' => 'Penyetoran disetujui!',
                'data' => [
                    'tabung_sampah' => new TabungSampahResource($tabungSampah->fresh()),
                    'user' => $user->fresh(),
                    'poin_diberikan' => $pointCalculation['total'],
                    'breakdown' => $pointCalculation['breakdown'],
                    'new_badges' => $newBadges,
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning("Validation error on approve", [
                'id' => $id,
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error("Error approving tabung_sampah", [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    // PUT /api/admin/tabung-sampah/{id}/reject
    public function reject(Request $request, $id)
    {
        $tabungSampah = TabungSampah::findOrFail($id);

        $tabungSampah->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Penyetoran ditolak',
            'data' => new TabungSampahResource($tabungSampah),
        ]);
    }

    // Helper: get upload error message
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
}
