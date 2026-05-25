<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Artikel;
use Illuminate\Support\Str;
use App\Http\Resources\ArtikelResource;
use App\Services\CloudinaryService;

class ArtikelController extends Controller
{
    // GET /api/artikel
    public function index()
    {
        $artikel = Artikel::orderBy('tanggal_publikasi', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => ArtikelResource::collection($artikel),
        ], 200);
    }

    // GET /api/artikel/{slug}
    public function show($identifier)
    {
        // Support both ID (numeric) and slug lookup
        if (is_numeric($identifier)) {
            $artikel = Artikel::find($identifier);
        } else {
            $artikel = Artikel::where('slug', $identifier)->first();
        }

        if (!$artikel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Artikel tidak ditemukan',
            ], 404);
        }

        // Increment Article views
        $artikel->increment('views');

        return response()->json([
            'status' => 'success',
            'data' => new ArtikelResource($artikel),
        ], 200);
    }

    // POST /api/artikel (Admin only)
    public function store(Request $request)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        try {
            $validated = $request->validate([
                'judul' => 'required|string|max:255',
                'konten' => 'required|string',
                'foto_cover' => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:2048',
                'penulis' => 'required|string|max:100',
                'kategori' => 'required|string|max:50',
                'tanggal_publikasi' => 'required|date',
            ]);

            // Generate slug
            $validated['slug'] = Str::slug($validated['judul']);

            // Ensure unique slug
            $originalSlug = $validated['slug'];
            $counter = 1;
            while (Artikel::where('slug', $validated['slug'])->exists()) {
                $validated['slug'] = $originalSlug . '-' . $counter;
                $counter++;
            }

            // Handle file upload to Cloudinary
            if ($request->hasFile('foto_cover')) {
                $file = $request->file('foto_cover');

                try {
                    $cloudinaryService = new CloudinaryService();
                    $uploadResult = $cloudinaryService->uploadImage($file, 'artikel');

                    if ($uploadResult['success']) {
                        $validated['foto_cover'] = $uploadResult['url'];
                        $validated['foto_cover_public_id'] = $uploadResult['public_id'];
                    } else {
                        \Log::warning('Cloudinary upload failed, using local storage', [
                            'error' => $uploadResult['error'] ?? 'Unknown error'
                        ]);
                        // Fallback to local storage
                        $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
                        $path = $file->storeAs('uploads/artikel', $filename, 'public');
                        $validated['foto_cover'] = 'storage/' . $path;
                    }
                } catch (\Exception $uploadError) {
                    \Log::error('File upload exception', ['error' => $uploadError->getMessage()]);
                    // Continue without photo
                    unset($validated['foto_cover']);
                }
            }

            // Set default views
            $validated['views'] = 0;

            $artikel = Artikel::create($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Artikel berhasil ditambahkan',
                'data' => new ArtikelResource($artikel),
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Artikel store error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menambahkan artikel: ' . $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/artikel/{slug} (Admin only)
    public function update(Request $request, $slug)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $artikel = Artikel::where('slug', $slug)->first();

        if (!$artikel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Artikel tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'judul' => 'nullable|string',
            'konten' => 'nullable|string',
            'foto_cover' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'penulis' => 'nullable|string',
            'kategori' => 'nullable|string',
            'tanggal_publikasi' => 'nullable|date',
        ]);

        // Update slug if judul changed
        if (isset($validated['judul'])) {
            $validated['slug'] = Str::slug($validated['judul']);
        }

        // Handle file upload
        if ($request->hasFile('foto_cover')) {
            $file = $request->file('foto_cover');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('uploads/artikel', $filename, 'public');
            $validated['foto_cover'] = $path;
        }

        $artikel->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Artikel berhasil diupdate',
            'data' => new ArtikelResource($artikel),
        ], 200);
    }

    // DELETE /api/artikel/{slug} (Admin only)
    public function destroy($slug, Request $request)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $artikel = Artikel::where('slug', $slug)->first();

        if (!$artikel) {
            return response()->json([
                'status' => 'error',
                'message' => 'Artikel tidak ditemukan',
            ], 404);
        }

        $artikel->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Artikel berhasil dihapus',
        ], 200);
    }
}
