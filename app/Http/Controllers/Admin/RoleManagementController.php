<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RoleManagementController extends Controller
{
    // GET /api/admin/roles
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
            $roles = Role::with('permissions')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $roles,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/roles/{id}
    public function show($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $role = Role::with(['permissions', 'users'])
                ->findOrFail($roleId);

            return response()->json([
                'success' => true,
                'data' => $role,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // POST /api/admin/roles
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
            'nama' => 'required|string|max:100|unique:roles,nama',
            'deskripsi' => 'nullable|string',
        ]);

        try {
            $role = Role::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil dibuat',
                'data' => $role,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/admin/roles/{id}
    public function update($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $role = Role::findOrFail($roleId);

            // Prevent editing system roles
            if (in_array($role->kode, ['nasabah', 'admin', 'superadmin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah role sistem',
                ], 403);
            }

            $validated = $request->validate([
                'nama' => ['nullable', 'string', 'max:100', Rule::unique('roles')->ignore($roleId)],
                'deskripsi' => 'nullable|string',
            ]);

            $role->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil diupdate',
                'data' => $role,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/roles/{id}
    public function destroy($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $role = Role::findOrFail($roleId);

            // Prevent deleting system roles
            if (in_array($role->kode, ['nasabah', 'admin', 'superadmin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus role sistem',
                ], 403);
            }

            // Check if role has users
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat menghapus role yang memiliki user',
                ], 403);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Role berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/roles/{id}/users
    public function getUsers($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $role = Role::findOrFail($roleId);

            $users = $role->users()
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $users,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil users',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
