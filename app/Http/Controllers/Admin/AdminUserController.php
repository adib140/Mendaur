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
    // GET /api/admin/users
    public function index(Request $request)
    {
        try {
            $validated = $request->validate([
                'page' => 'nullable|integer|min:1',
                'limit' => 'nullable|integer|min:1|max:100',
                'search' => 'nullable|string|max:255',
                'sort' => 'nullable|in:nama,email,created_at,tipe_nasabah',
                'order' => 'nullable|in:ASC,DESC,asc,desc',
            ]);

            $query = DB::table('users')->where('deleted_at', null);

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
                    'role_id' => $user->role_id ? (int) $user->role_id : null,
                    'level' => $user->level, // String: Bronze, Silver, Gold, Admin, Superadmin
                    'total_poin' => (int) ($user->actual_poin ?? 0),
                    'display_poin' => (int) ($user->display_poin ?? 0),
                    'actual_poin' => (int) ($user->actual_poin ?? 0),
                    'total_setor_sampah' => (float) ($user->total_setor_sampah ?? 0),
                    'joinDate' => $user->created_at,
                    'lastUpdated' => $user->updated_at,
                ];
            })->toArray();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'users' => $userData,
                    'pagination' => [
                        'currentPage' => (int) $page,
                        'totalPages' => (int) ceil($total / $limit),
                        'totalUsers' => (int) $total,
                        'limit' => (int) $limit,
                        'hasNextPage' => $page < ceil($total / $limit),
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

    // POST /api/admin/users
    public function store(Request $request)
    {
        try {
            // Auto-correct typo
            if ($request->has('tipe_nasabah') && $request->tipe_nasabah === 'konvensionalr') {
                $request->merge(['tipe_nasabah' => 'konvensional']);
            }

            $validated = $request->validate([
                'nama' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'no_hp' => 'nullable|string|max:20',
                'alamat' => 'nullable|string',
                'role_id' => 'nullable|integer|exists:roles,role_id',
                'tipe_nasabah' => 'nullable|in:reguler,premium,konvensional,modern',
                'status' => 'nullable|in:active,inactive,suspended',
            ]);

            $validated['password'] = bcrypt($validated['password']);
            $validated['status'] = $validated['status'] ?? 'active';
            $validated['tipe_nasabah'] = $validated['tipe_nasabah'] ?? 'konvensional';
            $validated['actual_poin'] = 0;
            $validated['display_poin'] = 0;
            $validated['total_setor_sampah'] = 0;

            // Level berdasarkan role
            if (isset($validated['role_id'])) {
                $role = \App\Models\Role::find($validated['role_id']);
                if ($role) {
                    if ($role->level_akses == 3) {
                        $validated['level'] = 'superadmin';
                    } elseif ($role->level_akses == 2) {
                        $validated['level'] = 'admin';
                    } else {
                        $validated['level'] = 'bronze';
                    }
                } else {
                    $validated['level'] = 'bronze';
                }
            } else {
                $nasabahRole = \App\Models\Role::where('nama_role', 'Nasabah')->first();
                $validated['role_id'] = $nasabahRole ? $nasabahRole->role_id : 1;
                $validated['level'] = 'bronze';
            }

            $user = User::create($validated);

            return response()->json([
                'status' => 'success',
                'message' => 'User berhasil dibuat',
                'data' => [
                    'user_id' => $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'status' => $user->status,
                    'role_id' => $user->role_id,
                    'level' => $user->level,
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('User creation failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/users/{userId}
    public function show($userId)
    {
        try {
            $request = request();

            // Validate userId
            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID',
                    'error' => 'User ID must be a positive integer'
                ], 422);
            }

            $user = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'error' => 'User with ID ' . $userId . ' does not exist'
                ], 404);
            }

            // Get role name if role_id exists
            $roleName = null;
            $permissionsCount = 0;
            if ($user->role_id) {
                $role = Role::find($user->role_id);
                if ($role) {
                    $roleName = $role->nama_role;
                    $permissionsCount = $role->permissions()->count();
                }
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'alamat' => $user->alamat,
                    'role_id' => (int) $user->role_id,
                    'role_name' => $roleName,
                    'permissions_count' => (int) $permissionsCount,
                    'level' => (int) $user->level,
                    'status' => $user->status,
                    'tipe_nasabah' => $user->tipe_nasabah,
                    'actual_poin' => (int) $user->actual_poin,
                    'display_poin' => (int) $user->display_poin,
                    'total_setor_sampah' => (float) $user->total_setor_sampah,
                    'foto_profil' => $user->foto_profil,
                    'joinDate' => $user->created_at->toIso8601String(),
                    'lastUpdated' => $user->updated_at->toIso8601String(),
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

    // PATCH /api/admin/users/{userId}/status
    public function updateStatus(Request $request, $userId)
    {
        try {
            // Validate userId
            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID',
                    'error' => 'User ID must be a positive integer'
                ], 422);
            }

            $validated = $request->validate([
                'status' => 'required|in:active,inactive,suspended'
            ]);

            $user = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'error' => 'User with ID ' . $userId . ' does not exist'
                ], 404);
            }

            // Check if already in this status
            if ($user->status === $validated['status']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'User already has this status',
                    'data' => [
                        'user_id' => (int) $user->user_id,
                        'nama' => $user->nama,
                        'email' => $user->email,
                        'status' => $user->status,
                        'updated_at' => $user->updated_at->toIso8601String(),
                    ]
                ], 200);
            }

            $user->update(['status' => $validated['status']]);

            return response()->json([
                'status' => 'success',
                'message' => 'User status updated successfully',
                'data' => [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'status' => $user->status,
                    'updated_at' => $user->updated_at->toIso8601String(),
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

    // PUT /api/admin/users/{userId}
    public function update(Request $request, $userId)
    {
        try {
            // Validate userId
            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID',
                    'error' => 'User ID must be a positive integer'
                ], 422);
            }

            $validated = $request->validate([
                'nama' => 'nullable|string|max:255',
                'email' => [
                    'nullable',
                    'email',
                    Rule::unique('users', 'email')->ignore($userId, 'user_id')
                ],
                'no_hp' => 'nullable|string|max:20',
                'alamat' => 'nullable|string|max:500',
            ]);

            $user = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'error' => 'User with ID ' . $userId . ' does not exist'
                ], 404);
            }

            // Update only fields that were provided
            $updateData = array_filter($validated, fn($value) => $value !== null);

            if (empty($updateData)) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'No changes made',
                    'data' => [
                        'user_id' => (int) $user->user_id,
                        'nama' => $user->nama,
                        'email' => $user->email,
                        'no_hp' => $user->no_hp,
                        'alamat' => $user->alamat,
                        'updated_at' => $user->updated_at->toIso8601String(),
                    ]
                ], 200);
            }

            $user->update($updateData);

            return response()->json([
                'status' => 'success',
                'message' => 'User information updated successfully',
                'data' => [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'alamat' => $user->alamat,
                    'role_id' => (int) $user->role_id,
                    'status' => $user->status,
                    'tipe_nasabah' => $user->tipe_nasabah,
                    'actual_poin' => (int) $user->actual_poin,
                    'display_poin' => (int) $user->display_poin,
                    'updated_at' => $user->updated_at->toIso8601String(),
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
                'message' => 'Failed to update user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/users/{userId}
    public function destroy($userId)
    {
        try {
            // Validate userId
            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID',
                    'error' => 'User ID must be a positive integer'
                ], 422);
            }

            $user = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'error' => 'User with ID ' . $userId . ' does not exist'
                ], 404);
            }

            // Prevent self-deletion (optional - get current user from auth)
            if (auth()->check() && auth()->user()->user_id == $userId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot delete own account',
                    'error' => 'Users cannot delete their own account'
                ], 403);
            }

            // Perform soft delete
            $user->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'User deleted successfully',
                'data' => [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'deleted_at' => $user->deleted_at->toIso8601String(),
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

    // PATCH /api/admin/users/{userId}/role
    public function updateRole(Request $request, $userId)
    {
        try {
            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID',
                    'error' => 'User ID must be a positive integer'
                ], 422);
            }

            $validated = $request->validate([
                'role_id' => 'required|integer|exists:roles,role_id'
            ]);

            $user = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'error' => 'User with ID ' . $userId . ' does not exist'
                ], 404);
            }

            // Check if already has this role
            if ($user->role_id === $validated['role_id']) {
                $role = Role::find($validated['role_id']);
                return response()->json([
                    'status' => 'success',
                    'message' => 'User already has this role',
                    'data' => [
                        'user_id' => (int) $user->user_id,
                        'nama' => $user->nama,
                        'email' => $user->email,
                        'role_id' => (int) $user->role_id,
                        'role_name' => $role ? $role->nama_role : null,
                        'permissions_count' => $role ? (int) $role->permissions()->count() : 0,
                        'updated_at' => $user->updated_at->toIso8601String(),
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

            // Level berdasarkan role baru
            $updateData = ['role_id' => $validated['role_id']];

            switch ($newRole->level_akses) {
                case 3:
                    $updateData['level'] = 'superadmin';
                    break;
                case 2:
                    $updateData['level'] = 'admin';
                    break;
                case 1:
                default:
                    $validNasabahLevels = ['bronze', 'silver', 'gold'];
                    if (!in_array($user->level, $validNasabahLevels)) {
                        $updateData['level'] = 'bronze';
                    }
                    break;
            }

            $user->update($updateData);
            $user->refresh();
            $role = Role::find($validated['role_id']);

            return response()->json([
                'status' => 'success',
                'message' => 'User role updated successfully',
                'data' => [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'role_id' => (int) $user->role_id,
                    'role_name' => $role ? $role->nama_role : null,
                    'level' => $user->level,
                    'permissions_count' => $role ? (int) $role->permissions()->count() : 0,
                    'updated_at' => $user->updated_at->toIso8601String(),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Role update failed', ['error' => $e->getMessage(), 'userId' => $userId]);
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user role',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/admin/users/{userId}/tipe
    public function updateTipe(Request $request, $userId)
    {
        try {
            // Validate userId
            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID',
                    'error' => 'User ID must be a positive integer'
                ], 422);
            }

            $validated = $request->validate([
                'tipe_nasabah' => 'required|in:regular,premium,corporate,staff'
            ]);

            $user = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found',
                    'error' => 'User with ID ' . $userId . ' does not exist'
                ], 404);
            }

            // Check if already has this type
            if ($user->tipe_nasabah === $validated['tipe_nasabah']) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'User already has this type',
                    'data' => [
                        'user_id' => (int) $user->user_id,
                        'nama' => $user->nama,
                        'email' => $user->email,
                        'tipe_nasabah' => $user->tipe_nasabah,
                        'updated_at' => $user->updated_at->toIso8601String(),
                    ]
                ], 200);
            }

            $user->update(['tipe_nasabah' => $validated['tipe_nasabah']]);

            return response()->json([
                'status' => 'success',
                'message' => 'User type updated successfully',
                'data' => [
                    'user_id' => (int) $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'tipe_nasabah' => $user->tipe_nasabah,
                    'updated_at' => $user->updated_at->toIso8601String(),
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
}
