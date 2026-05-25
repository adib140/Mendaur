<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;

class PermissionAssignmentController extends Controller
{
    // GET /api/admin/roles/{roleId}/permissions
    public function index($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $role = Role::with('permissions')->findOrFail($roleId);

            // Get all permissions for comparison
            $allPermissions = Permission::all();

            // Separate assigned and unassigned permissions
            $assignedPermissions = $role->permissions()->get();
            $assignedIds = $assignedPermissions->pluck('id')->toArray();
            $unassignedPermissions = $allPermissions->whereNotIn('id', $assignedIds);

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => $role,
                    'assigned_permissions' => $assignedPermissions,
                    'unassigned_permissions' => $unassignedPermissions,
                    'all_permissions' => $allPermissions,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/admin/roles/{roleId}/permissions
    public function assign($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        $validated = $request->validate([
            'permission_id' => 'required|exists:permissions,id',
        ]);

        try {
            $role = Role::findOrFail($roleId);

            // Prevent editing system roles permissions (except superadmin)
            if (in_array($role->kode, ['nasabah', 'admin']) && $roleId != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah permissions role sistem',
                ], 403);
            }

            // Check if permission already assigned
            if ($role->permissions()->where('permission_id', $validated['permission_id'])->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission sudah di-assign ke role ini',
                ], 409);
            }

            $role->permissions()->attach($validated['permission_id']);

            $permission = Permission::find($validated['permission_id']);

            return response()->json([
                'success' => true,
                'message' => 'Permission berhasil di-assign',
                'data' => [
                    'role' => $role,
                    'permission' => $permission,
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal assign permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/roles/{roleId}/permissions/{permissionId}
    public function revoke($roleId, $permissionId, Request $request)
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
            $permission = Permission::findOrFail($permissionId);

            // Prevent editing system roles permissions (except superadmin)
            if (in_array($role->kode, ['nasabah', 'admin']) && $roleId != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah permissions role sistem',
                ], 403);
            }

            // Check if permission is assigned
            if (!$role->permissions()->where('permission_id', $permissionId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission tidak di-assign ke role ini',
                ], 404);
            }

            $role->permissions()->detach($permissionId);

            return response()->json([
                'success' => true,
                'message' => 'Permission berhasil di-revoke',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal revoke permission',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PUT /api/admin/roles/{roleId}/permissions/bulk
    public function bulkAssign($roleId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        $validated = $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'required|exists:permissions,id',
        ]);

        try {
            $role = Role::findOrFail($roleId);

            // Prevent editing system roles permissions
            if (in_array($role->kode, ['nasabah', 'admin']) && $roleId != 3) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengubah permissions role sistem',
                ], 403);
            }

            // Attach new permissions
            $role->permissions()->sync($validated['permission_ids']);

            $role->load('permissions');

            return response()->json([
                'success' => true,
                'message' => 'Permissions berhasil diupdate',
                'data' => $role,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal bulk assign permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/permissions
    public function getAllPermissions(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $permissions = Permission::orderBy('kode')->get();

            return response()->json([
                'success' => true,
                'data' => $permissions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
