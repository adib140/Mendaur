<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    // GET /api/admin/admins
    public function index(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $admins = User::where('level_akses', '!=', 1) // Get Admin and Superadmin users
                ->with('role')
                ->orderBy('created_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $admins,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/admins/{id}
    public function show($adminId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $admin = User::findOrFail($adminId);

            // Verify admin user (level_akses != 1)
            if ($admin->level_akses == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User adalah Nasabah, bukan Admin',
                ], 404);
            }

            $admin->load(['role', 'tokens']);

            return response()->json([
                'success' => true,
                'data' => $admin,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // POST /api/admin/admins
    public function store(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        $validated = $request->validate([
            'nama_lengkap' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'nomor_telepon' => 'required|string|unique:users,nomor_telepon',
            'level_akses' => 'required|in:2,3', // 2 = Admin, 3 = Superadmin
            'foto_profil' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
        ]);

        try {
            // Handle photo upload
            if ($request->hasFile('foto_profil')) {
                $file = $request->file('foto_profil');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('uploads/profiles', $filename, 'public');
                $validated['foto_profil'] = $path;
            }

            $validated['password'] = Hash::make($validated['password']);
            $validated['role_id'] = $validated['level_akses'];

            $admin = User::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Admin berhasil dibuat',
                'data' => $admin,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/admin/admins/{id}
    public function update($adminId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $admin = User::findOrFail($adminId);

            // Verify admin user
            if ($admin->level_akses == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User adalah Nasabah, bukan Admin',
                ], 404);
            }

            $validated = $request->validate([
                'nama_lengkap' => 'nullable|string|max:255',
                'email' => ['nullable', 'email', Rule::unique('users')->ignore($adminId)],
                'nomor_telepon' => ['nullable', 'string', Rule::unique('users')->ignore($adminId)],
                'level_akses' => 'nullable|in:2,3',
                'foto_profil' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
                'status' => 'nullable|in:aktif,nonaktif',
            ]);

            // Handle photo upload
            if ($request->hasFile('foto_profil')) {
                $file = $request->file('foto_profil');
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('uploads/profiles', $filename, 'public');
                $validated['foto_profil'] = $path;
            }

            // Update role_id if level_akses changed
            if (isset($validated['level_akses'])) {
                $validated['role_id'] = $validated['level_akses'];
            }

            $admin->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Admin berhasil diupdate',
                'data' => $admin,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/admins/{id}
    public function destroy($adminId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $admin = User::findOrFail($adminId);

            // Verify admin user
            if ($admin->level_akses == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User adalah Nasabah, bukan Admin',
                ], 404);
            }

            // Prevent deleting current user
            if ($admin->id === $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus diri sendiri',
                ], 403);
            }

            $admin->delete();

            return response()->json([
                'success' => true,
                'message' => 'Admin berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/admins/{id}/activity
    public function getActivity($adminId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $admin = User::findOrFail($adminId);

            // Verify admin user
            if ($admin->level_akses == 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'User adalah Nasabah, bukan Admin',
                ], 404);
            }

            // Get recent tokens (activity indicator)
            $tokens = $admin->tokens()
                ->latest()
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $tokens,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil activity log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
