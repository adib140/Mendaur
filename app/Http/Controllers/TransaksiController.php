<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaksi;

class TransaksiController extends Controller
{
    // List all transaksis
    public function index()
    {
        $transaksis = Transaksi::with(['user', 'kategori'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $transaksis
        ]);
    }

    // Store new transaksi
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,user_id',
            'kategori_id' => 'required|exists:kategori_transaksi,id',
            'jumlah' => 'required|numeric',
            'deskripsi' => 'nullable|string',
        ]);

        $transaksi = Transaksi::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $transaksi
        ], 201);
    }

    // Get single transaksi
    public function show(Transaksi $transaksi)
    {
        return response()->json([
            'status' => 'success',
            'data' => $transaksi->load(['user', 'kategori'])
        ]);
    }

    // Update transaksi
    public function update(Request $request, Transaksi $transaksi)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,user_id',
            'kategori_id' => 'nullable|exists:kategori_transaksi,id',
            'jumlah' => 'nullable|numeric',
            'deskripsi' => 'nullable|string',
        ]);

        $transaksi->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $transaksi
        ]);
    }

    // Delete transaksi
    public function destroy(Transaksi $transaksi)
    {
        $transaksi->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi deleted successfully'
        ]);
    }

    // User ID Filter
    public function byUser($id)
    {
        $transaksis = \App\Models\Transaksi::with('kategori')
            ->where('user_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $transaksis
        ]);
    }
}
