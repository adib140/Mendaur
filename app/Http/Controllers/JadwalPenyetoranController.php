<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\JadwalPenyetoran;
use App\Http\Resources\JadwalPenyetoranResource;

class JadwalPenyetoranController extends Controller
{
    // List semua jadwal
    public function index()
    {
        $data = JadwalPenyetoran::orderByRaw("FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')")
            ->orderBy('waktu_mulai', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => JadwalPenyetoranResource::collection($data)
        ]);
    }

    // Tambah jadwal baru (Admin/Superadmin only)
    public function store(Request $request)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $validated = $request->validate([
            'hari' => 'required|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'waktu_mulai' => 'required',
            'waktu_selesai' => 'required',
            'lokasi' => 'required|string',
            'status' => 'nullable|in:Buka,Tutup',
        ]);

        // Normalize time format (handle both H:i and H:i:s)
        if (isset($validated['waktu_mulai'])) {
            $validated['waktu_mulai'] = date('H:i:s', strtotime($validated['waktu_mulai']));
        }
        if (isset($validated['waktu_selesai'])) {
            $validated['waktu_selesai'] = date('H:i:s', strtotime($validated['waktu_selesai']));
        }

        // Default status to 'Buka' if not provided
        $validated['status'] = $validated['status'] ?? 'Buka';

        $jadwal = JadwalPenyetoran::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => new JadwalPenyetoranResource($jadwal)
        ], 201);
    }

    // Jadwal penyetoran aktif (status = Buka)
    public function aktif()
    {
        $data = JadwalPenyetoran::where('status', 'Buka')
            ->orderByRaw("FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')")
            ->orderBy('waktu_mulai', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => JadwalPenyetoranResource::collection($data)
        ]);
    }

    // Daftar setoran pada jadwal tertentu
    public function setoran(JadwalPenyetoran $jadwalPenyetoran)
    {
        return response()->json([
            'status' => 'success',
            'data' => $jadwalPenyetoran->tabungSampah()->with('user')->get()
        ]);
    }

    // Detail jadwal
    public function show(JadwalPenyetoran $jadwalPenyetoran)
    {
        return response()->json([
            'status' => 'success',
            'data' => new JadwalPenyetoranResource($jadwalPenyetoran)
        ]);
    }

    // Update jadwal (Admin/Superadmin only)
    public function update(Request $request, JadwalPenyetoran $jadwalPenyetoran)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $validated = $request->validate([
            'hari' => 'nullable|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'waktu_mulai' => 'nullable',
            'waktu_selesai' => 'nullable',
            'lokasi' => 'nullable|string',
            'status' => 'nullable|in:Buka,Tutup',
        ]);

        // Normalize time format (handle both H:i and H:i:s)
        if (isset($validated['waktu_mulai'])) {
            $validated['waktu_mulai'] = date('H:i:s', strtotime($validated['waktu_mulai']));
        }
        if (isset($validated['waktu_selesai'])) {
            $validated['waktu_selesai'] = date('H:i:s', strtotime($validated['waktu_selesai']));
        }

        $jadwalPenyetoran->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => new JadwalPenyetoranResource($jadwalPenyetoran)
        ]);
    }

    // Hapus jadwal (Admin/Superadmin only)
    public function destroy(JadwalPenyetoran $jadwalPenyetoran, Request $request)
    {
        // Verify admin or superadmin role
        if (!$request->user()?->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized - Admin role required',
            ], 403);
        }

        $jadwalPenyetoran->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal berhasil dihapus'
        ]);
    }
}
