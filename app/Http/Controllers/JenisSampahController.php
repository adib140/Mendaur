<?php

namespace App\Http\Controllers;

use App\Models\JenisSampah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\JenisSampahResource;

class JenisSampahController extends Controller
{
    // POST /api/admin/jenis-sampah
    public function store(Request $request)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'kategori_sampah_id' => 'required|exists:kategori_sampah,kategori_sampah_id',
            'nama_jenis' => 'required|string|max:100',
            'harga_per_kg' => 'required|numeric|min:0',
            'satuan' => 'sometimes|string|max:20',
            'kode' => 'nullable|string|max:20|unique:jenis_sampah,kode',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $jenis = JenisSampah::create($validator->validated());
            $jenis->load('kategori');

            return response()->json([
                'success' => true,
                'message' => 'Jenis sampah berhasil ditambahkan',
                'data' => new JenisSampahResource($jenis)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan jenis sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/admin/jenis-sampah/{id}
    public function update(Request $request, $id)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'kategori_sampah_id' => 'sometimes|exists:kategori_sampah,kategori_sampah_id',
            'nama_jenis' => 'sometimes|required|string|max:100',
            'harga_per_kg' => 'sometimes|numeric|min:0',
            'satuan' => 'sometimes|string|max:20',
            'kode' => 'nullable|string|max:20|unique:jenis_sampah,kode,' . $id . ',jenis_sampah_id',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $jenis = JenisSampah::findOrFail($id);
            $jenis->update($validator->validated());
            $jenis->load('kategori');

            return response()->json([
                'success' => true,
                'message' => 'Jenis sampah berhasil diupdate',
                'data' => new JenisSampahResource($jenis)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate jenis sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/jenis-sampah/{id}
    public function destroy($id, Request $request)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        try {
            $jenis = JenisSampah::findOrFail($id);
            $jenis->delete();

            return response()->json([
                'success' => true,
                'message' => 'Jenis sampah berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus jenis sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/jenis-sampah
    public function index(Request $request)
    {
        try {
            $query = JenisSampah::with('kategori');

            // Filter by category if provided
            if ($request->has('kategori_id')) {
                $query->byKategori($request->kategori_id);
            }

            // Filter by active status
            if ($request->input('active', true)) {
                $query->aktif();
            }

            $jenisSampah = $query->orderBy('nama_jenis')->get();

            return response()->json([
                'success' => true,
                'data' => JenisSampahResource::collection($jenisSampah),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jenis sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/jenis-sampah/{id}
    public function show($id)
    {
        try {
            $jenis = JenisSampah::with('kategori')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new JenisSampahResource($jenis)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Jenis sampah tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // GET /api/jenis-sampah/stats
    public function stats()
    {
        try {
            $totalJenis = JenisSampah::count();
            $totalKategori = JenisSampah::distinct('kategori_sampah_id')->count('kategori_sampah_id');
            $hargaTertinggi = JenisSampah::max('harga_per_kg') ?? 0;
            $hargaTerendah = JenisSampah::where('harga_per_kg', '>', 0)->min('harga_per_kg') ?? 0;
            $hargaRataRata = JenisSampah::where('harga_per_kg', '>', 0)->avg('harga_per_kg') ?? 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_jenis' => (int) $totalJenis,
                    'total_kategori' => (int) $totalKategori,
                    'harga_tertinggi' => (float) $hargaTertinggi,
                    'harga_terendah' => (float) $hargaTerendah,
                    'harga_rata_rata' => round((float) $hargaRataRata, 0),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
