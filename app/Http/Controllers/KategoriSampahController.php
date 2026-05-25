<?php

namespace App\Http\Controllers;

use App\Models\KategoriSampah;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\KategoriSampahResource;
use App\Http\Resources\JenisSampahResource;

class KategoriSampahController extends Controller
{
    // GET /api/kategori-sampah
    public function index()
    {
        try {
            $kategori = KategoriSampah::with(['activeJenisSampah' => function($query) {
                $query->orderBy('nama_jenis');
            }])
            ->where('is_active', true)
            ->orderBy('nama_kategori')
            ->get();

            return response()->json([
                'success' => true,
                'message' => 'Kategori sampah berhasil diambil',
                'data' => KategoriSampahResource::collection($kategori)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil kategori sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/kategori-sampah/{id}
    public function show($id)
    {
        try {
            $kategori = KategoriSampah::with('activeJenisSampah')
                ->where('is_active', true)
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Detail kategori sampah berhasil diambil',
                'data' => new KategoriSampahResource($kategori)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori sampah tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // GET /api/kategori-sampah/{id}/jenis
    public function getJenisByKategori($id)
    {
        try {
            $kategori = KategoriSampah::findOrFail($id);
            $jenisSampah = $kategori->activeJenisSampah()
                ->orderBy('nama_jenis')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Jenis sampah berhasil diambil',
                'data' => [
                    'kategori' => new KategoriSampahResource($kategori),
                    'jenis_sampah' => JenisSampahResource::collection($jenisSampah)
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil jenis sampah',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // GET /api/jenis-sampah
    public function getAllJenisSampah()
    {
        try {
            $jenisSampah = \App\Models\JenisSampah::with('kategori')
                ->orderBy('nama')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Semua jenis sampah berhasil diambil',
                'data' => JenisSampahResource::collection($jenisSampah)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil jenis sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/admin/kategori-sampah
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_kategori' => 'required|string|max:100',
            'deskripsi' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'warna' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $kategori = KategoriSampah::create($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Kategori sampah berhasil ditambahkan',
                'data' => new KategoriSampahResource($kategori)
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan kategori sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/admin/kategori-sampah/{id}
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nama_kategori' => 'sometimes|required|string|max:100',
            'deskripsi' => 'nullable|string',
            'icon' => 'nullable|string|max:10',
            'warna' => 'nullable|string|max:20',
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
            $kategori = KategoriSampah::findOrFail($id);
            $kategori->update($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Kategori sampah berhasil diupdate',
                'data' => new KategoriSampahResource($kategori)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate kategori sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/kategori-sampah/{id}
    public function destroy($id)
    {
        try {
            $kategori = KategoriSampah::findOrFail($id);
            $kategori->delete();

            return response()->json([
                'success' => true,
                'message' => 'Kategori sampah berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus kategori sampah',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
