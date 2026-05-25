<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Http\Resources\AuthUserResource;
use App\Http\Resources\UserResource;

class AuthController extends Controller
{
    // POST /api/auth/login
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Find user by email
        $user = User::where('email', $request->email)->first();

        // Check if user exists and password is correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau password salah',
            ], 401);
        }

        // Create Sanctum authentication token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Get role name from role_id
        $roleName = 'user';
        if ($user->role_id) {
            $role = \App\Models\Role::find($user->role_id);
            $roleName = $role ? strtolower($role->nama_role) : 'user';
        }

        // Get permissions count
        $permissionsCount = 0;
        if ($user->role_id) {
            $role = \App\Models\Role::find($user->role_id);
            $permissionsCount = $role ? $role->permissions()->count() : 0;
        }

        // Return login response with foto_profil field
        return response()->json([
            'status' => 'success',
            'message' => 'Login berhasil',
            'data' => [
                'user' => [
                    'user_id' => $user->user_id,
                    'nama' => $user->nama,
                    'email' => $user->email,
                    'no_hp' => $user->no_hp,
                    'foto_profil' => $this->getPhotoUrl($user->foto_profil), // Cloudinary URL or null
                    'actual_poin' => $user->actual_poin,
                    'level' => $user->level,
                    'role_id' => $user->role_id,
                    'role' => $roleName,
                    'permissions' => $permissionsCount,
                ],
                'token' => $token,
            ],
        ], 200);
    }

    // Helper: get full URL for profile photo
    private function getPhotoUrl(?string $fotoProfil): ?string
    {
        if (empty($fotoProfil)) {
            return null;
        }

        // If already a full URL (Cloudinary), return as-is
        if (str_starts_with($fotoProfil, 'http://') || str_starts_with($fotoProfil, 'https://')) {
            // Ensure HTTPS for Cloudinary URLs
            return str_replace('http://', 'https://', $fotoProfil);
        }

        // Otherwise, it's local storage path - use secure URL
        return secure_asset('storage/' . $fotoProfil);
    }

    // POST /api/auth/register
    public function register(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'no_hp' => 'required|string|unique:users,no_hp',
            'alamat' => 'nullable|string',
        ], [
            'email.unique' => 'Email sudah terdaftar',
            'no_hp.unique' => 'Nomor HP sudah terdaftar',
        ]);

        try {
            $user = User::create([
                'nama' => $request->nama,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'no_hp' => $request->no_hp,
                'alamat' => $request->alamat,
                'actual_poin' => 0,
                'display_poin' => 0,
                'total_setor_sampah' => 0,
                'level' => 'Pemula',
                'role_id' => 1,
                'status' => 'active',
                'tipe_nasabah' => 'konvensional',
            ]);

            // Load role for response
            $user->load('role.permissions');

            return response()->json([
                'status' => 'success',
                'message' => 'Registrasi berhasil',
                'data' => (new UserResource($user))->resolve(request()),
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Registration failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Registrasi gagal. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // POST /api/auth/logout
    public function logout(Request $request)
    {
        // Revoke the current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logout berhasil',
        ], 200);
    }

    // GET /api/auth/profile
    public function profile(Request $request)
    {
        // This requires authentication middleware
        $user = $request->user();

        // Refresh user data from database to get latest points
        $user->refresh();

        // Load role and permissions
        $user->load('role.permissions');

        return response()->json([
            'status' => 'success',
            'data' => (new AuthUserResource($user))->resolve(request()),
        ], 200);
    }

    // PUT /api/auth/profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->user_id . ',user_id',
            'no_hp' => 'sometimes|string|max:20',
            'alamat' => 'sometimes|string|nullable',
            'nama_bank' => 'sometimes|string|nullable',
            'nomor_rekening' => 'sometimes|string|nullable',
            'atas_nama_rekening' => 'sometimes|string|nullable',
        ]);

        // Update only fillable fields that were provided
        $updateData = $request->only([
            'nama',
            'email',
            'no_hp',
            'alamat',
            'nama_bank',
            'nomor_rekening',
            'atas_nama_rekening',
        ]);

        // Remove null values to avoid overwriting existing data
        $updateData = array_filter($updateData, fn($value) => $value !== null);

        $user->update($updateData);
        $user->refresh();
        $user->load('role.permissions');

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully',
            'data' => (new AuthUserResource($user))->resolve(request()),
        ], 200);
    }
}
