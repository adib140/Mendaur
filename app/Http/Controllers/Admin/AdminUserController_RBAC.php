<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    // Check admin access
    private function authorizeAdminAccess(Request $request)
    {
        $user = $request->user();

        if (!$user->isAdminUser() && !$user->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized',
                'error' => 'Only admin or superadmin can access this endpoint'
            ], 403);
        }

        return null;
    }

    // Check superadmin access
    private function authorizeSuperAdminOnly(Request $request)
    {
        $user = $request->user();

        if (!$user->isSuperAdmin()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden',
                'error' => 'Only superadmin can perform this action'
            ], 403);
        }

        return null;
    }

    // Check if admin can edit target user
    private function canEditUser(User $currentUser, User $targetUser): bool
    {
        // Superadmin can edit anyone
        if ($currentUser->isSuperAdmin()) {
            return true;
        }

        // Admin can only edit Nasabah
        if ($currentUser->isAdminUser()) {
            return $targetUser->isNasabah();
        }

        return false;
    }

    // GET /api/admin/users
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Authorization check
            $authError = $this->authorizeAdminAccess($request);
            if ($authError) return $authError;

            $validated = $request->validate([
                'page' => 'nullable|integer|min:1',
                'limit' => 'nullable|integer|min:1|max:100',
                'search' => 'nullable|string|max:255',
                'sort' => 'nullable|in:nama,email,created_at,tipe_nasabah',
                'order' => 'nullable|in:ASC,DESC,asc,desc',
                'role_filter' => 'nullable|in:nasabah,admin,superadmin',
            ]);

            $query = DB::table('users')->where('deleted_at', null);

            // RBAC: Filter by role
            if ($user->isAdminUser()) {
                // Admin: Only view Nasabah
                $nasabahRoleIds = Role::where('level_akses', 1)->pluck('role_id')->toArray();
                $query->whereIn('role_id', $nasabahRoleIds);
            }
            // Superadmin: No filter, sees all

            // Optional role filter (for superadmin to filter further)
            if (!empty($validated['role_filter'])) {
                if ($user->isSuperAdmin()) {
                    $roleLevel = $this->getRoleLevel($validated['role_filter']);
                    $query->whereIn('role_id',
                        Role::where('level_akses', $roleLevel)->pluck('role_id')->toArray()
                    );
                }
            }

            // Search
            if (!empty($validated['search'])) {
                $search = $validated['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('nama', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            $limit = min($validated['limit'] ?? 10, 100);
            $page = $validated['page'] ?? 1;
            $sort = $validated['sort'] ?? 'created_at';
            $order = strtoupper($validated['order'] ?? 'DESC');

            $total = $query->count();
            $offset = ($page - 1) * $limit;
            $totalPages = ceil($total / $limit);

            $users = $query
                ->orderBy($sort, $order)
                ->offset($offset)
                ->limit($limit)
                ->get();

            $userData = $users->map(function ($user) {
                return [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'status' => $user->status,
                    'tipe_nasabah' => $user->tipe_nasabah,
                    'role_id' => (int) $user->role_id,
                    'level' => (int) $user->level,
                    'actual_poin' => (int) $user->actual_poin,
                    'display_poin' => (int) $user->display_poin,
                    'total_setor_sampah' => (float) $user->total_setor_sampah,
                    'joinDate' => $user->created_at,
                    'lastUpdated' => $user->updated_at,
                ];
            })->toArray();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'users' => $userData,
                    'pagination' => [
                        'currentPage' => $page,
                        'totalPages' => $totalPages,
                        'totalUsers' => $total,
                        'limit' => $limit,
                        'hasNextPage' => $page < $totalPages,
                        'hasPrevPage' => $page > 1,
                    ]
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/users/{id}
    public function show(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Authorization check
            $authError = $this->authorizeAdminAccess($request);
            if ($authError) return $authError;

            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID'
                ], 422);
            }

            $targetUser = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // RBAC: Check if can view this user
            if ($currentUser->isAdminUser() && !$targetUser->isNasabah()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden',
                    'error' => 'Admin can only view nasabah data'
                ], 403);
            }

            $roleName = null;
            $permissionsCount = 0;
            if ($targetUser->role_id) {
                $role = Role::find($targetUser->role_id);
                if ($role) {
                    $roleName = $role->nama_role;
                    $permissionsCount = $role->permissions()->count();
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user_id' => (int) $targetUser->user_id,
                    'nama' => $targetUser->nama,
                    'email' => $targetUser->email,
                    'no_hp' => $targetUser->no_hp,
                    'alamat' => $targetUser->alamat,
                    'role_id' => (int) $targetUser->role_id,
                    'role_name' => $roleName,
                    'permissions_count' => (int) $permissionsCount,
                    'level' => (int) $targetUser->level,
                    'status' => $targetUser->status,
                    'tipe_nasabah' => $targetUser->tipe_nasabah,
                    'actual_poin' => (int) $targetUser->actual_poin,
                    'display_poin' => (int) $targetUser->display_poin,
                    'total_setor_sampah' => (float) $targetUser->total_setor_sampah,
                    'foto_profil' => $targetUser->foto_profil,
                    'joinDate' => $targetUser->created_at->toIso8601String(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/admin/users/{id}/status
    public function updateStatus(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Authorization check
            $authError = $this->authorizeAdminAccess($request);
            if ($authError) return $authError;

            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID'
                ], 422);
            }

            $validated = $request->validate([
                'status' => 'required|in:active,inactive,suspended'
            ]);

            $targetUser = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // RBAC: Check if can edit this user
            if (!$this->canEditUser($currentUser, $targetUser)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden',
                    'error' => 'You cannot change this user\'s status'
                ], 403);
            }

            // Superadmin cannot deactivate self
            if ($currentUser->user_id == $userId && $validated['status'] !== 'active') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error',
                    'error' => 'Superadmin cannot deactivate their own account'
                ], 403);
            }

            if ($targetUser->status === $validated['status']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'User status unchanged',
                    'data' => [
                        'user_id' => (int) $targetUser->user_id,
                        'status' => $targetUser->status,
                    ]
                ], 200);
            }

            // Log the change
            DB::table('audit_logs')->insert([
                'admin_id' => $currentUser->user_id,
                'user_id' => $targetUser->user_id,
                'action' => 'update_status',
                'old_value' => $targetUser->status,
                'new_value' => $validated['status'],
                'description' => "Status changed from {$targetUser->status} to {$validated['status']}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $targetUser->update(['status' => $validated['status']]);

            return response()->json([
                'status' => 'success',
                'message' => 'User status updated successfully',
                'data' => [
                    'user_id' => (int) $targetUser->user_id,
                    'status' => $validated['status'],
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/admin/users/{id}/role (Superadmin only)
    public function updateRole(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            $authError = $this->authorizeSuperAdminOnly($request);
            if ($authError) {
                return $authError;
            }

            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID'
                ], 422);
            }

            $validated = $request->validate([
                'role_id' => 'required|integer|exists:roles,role_id'
            ]);

            $targetUser = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            if ($currentUser->user_id == $userId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error',
                    'error' => 'Cannot change own role'
                ], 403);
            }

            if ($targetUser->role_id === $validated['role_id']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'User role unchanged',
                    'data' => [
                        'user_id' => (int) $targetUser->user_id,
                        'role_id' => $validated['role_id'],
                    ]
                ], 200);
            }

            $newRole = Role::find($validated['role_id']);
            if (!$newRole) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Role not found'
                ], 404);
            }

            $newLevel = $this->getLevelFromRole($newRole);

            $updateData = ['role_id' => $validated['role_id']];

            if ($newLevel !== null) {
                $updateData['level'] = $newLevel;
            } elseif ($newRole->level_akses === 1) {
                $validNasabahLevels = ['bronze', 'silver', 'gold'];
                if (!in_array($targetUser->level, $validNasabahLevels)) {
                    $updateData['level'] = 'bronze';
                }
            }

            $oldRoleName = $targetUser->role ? $targetUser->role->nama_role : 'None';
            $oldLevel = $targetUser->level;

            DB::table('audit_logs')->insert([
                'admin_id' => $currentUser->user_id,
                'user_id' => $targetUser->user_id,
                'action' => 'update_role',
                'old_value' => json_encode(['role_id' => $targetUser->role_id, 'level' => $oldLevel]),
                'new_value' => json_encode(['role_id' => $validated['role_id'], 'level' => $updateData['level'] ?? $oldLevel]),
                'description' => "Role changed from {$oldRoleName} (level: {$oldLevel}) to {$newRole->nama_role} (level: " . ($updateData['level'] ?? $oldLevel) . ")",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $targetUser->update($updateData);
            $targetUser->refresh();

            return response()->json([
                'status' => 'success',
                'message' => 'User role updated successfully',
                'data' => [
                    'user_id' => (int) $targetUser->user_id,
                    'role_id' => $targetUser->role_id,
                    'role_name' => $newRole->nama_role,
                    'level' => $targetUser->level,
                    'level_updated' => isset($updateData['level']),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to update user role', ['user_id' => $userId, 'error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/admin/users/{id}/tipe
    public function updateTipe(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Authorization check
            $authError = $this->authorizeAdminAccess($request);
            if ($authError) return $authError;

            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID'
                ], 422);
            }

            $validated = $request->validate([
                'tipe_nasabah' => 'required|in:konvensional,modern'
            ]);

            $targetUser = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // RBAC: Check if can edit this user
            if (!$this->canEditUser($currentUser, $targetUser)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden',
                    'error' => 'You cannot change this user\'s type'
                ], 403);
            }

            if ($targetUser->tipe_nasabah === $validated['tipe_nasabah']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'User type unchanged',
                    'data' => [
                        'user_id' => (int) $targetUser->user_id,
                        'tipe_nasabah' => $targetUser->tipe_nasabah,
                    ]
                ], 200);
            }

            // Log the change
            DB::table('audit_logs')->insert([
                'admin_id' => $currentUser->user_id,
                'user_id' => $targetUser->user_id,
                'action' => 'update_tipe_nasabah',
                'old_value' => $targetUser->tipe_nasabah,
                'new_value' => $validated['tipe_nasabah'],
                'description' => "Nasabah type changed from {$targetUser->tipe_nasabah} to {$validated['tipe_nasabah']}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $targetUser->update(['tipe_nasabah' => $validated['tipe_nasabah']]);

            return response()->json([
                'status' => 'success',
                'message' => 'User type updated successfully',
                'data' => [
                    'user_id' => (int) $targetUser->user_id,
                    'tipe_nasabah' => $validated['tipe_nasabah'],
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user type',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/users/{id}
    public function destroy(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Authorization check
            $authError = $this->authorizeAdminAccess($request);
            if ($authError) return $authError;

            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID'
                ], 422);
            }

            $targetUser = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // RBAC: Check if can delete this user
            if (!$this->canEditUser($currentUser, $targetUser)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden',
                    'error' => 'You cannot delete this user'
                ], 403);
            }

            // Cannot delete self
            if ($currentUser->user_id == $userId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error',
                    'error' => 'Cannot delete your own account'
                ], 403);
            }

            // Log the deletion
            DB::table('audit_logs')->insert([
                'admin_id' => $currentUser->user_id,
                'user_id' => $targetUser->user_id,
                'action' => 'delete_user',
                'old_value' => 'active',
                'new_value' => 'deleted',
                'description' => "User {$targetUser->nama} ({$targetUser->email}) deleted (soft delete)",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $targetUser->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully',
                'data' => [
                    'user_id' => (int) $targetUser->user_id,
                    'deleted_at' => $targetUser->fresh()->deleted_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Get role level from role name
    private function getRoleLevel($roleName)
    {
        $levels = [
            'nasabah' => 1,
            'admin' => 2,
            'superadmin' => 3,
        ];

        return $levels[$roleName] ?? 1;
    }

    // Get level string from role's level_akses
    private function getLevelFromRole($role)
    {
        if (!$role) {
            return 'bronze'; // Default for users without role
        }

        // Map level_akses to level string
        switch ($role->level_akses) {
            case 3:
                return 'superadmin';
            case 2:
                return 'admin';
            case 1:
            default:
                // For nasabah, keep their existing level (bronze, silver, gold)
                // Only return 'bronze' if they don't have a level yet
                return null; // Will be handled by caller
        }
    }
}
