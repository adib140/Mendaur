<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthUserResource extends JsonResource
{
    /**
     * Transform the resource into an array for auth responses.
     * Includes role and permissions.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $roleData = null;
        $permissions = [];

        if ($this->role && $this->role !== null) {
            $rolePermissions = $this->role->permissions;
            if ($rolePermissions) {
                $permissions = $rolePermissions->pluck('permission_code')->toArray();
            }
            $roleData = [
                'role_id' => $this->role->role_id,
                'nama_role' => $this->role->nama_role,
                'level_akses' => $this->role->level_akses,
                'permissions' => $permissions,
            ];
        }

        return [
            'user' => [
                'user_id' => $this->user_id,
                'nama' => $this->nama,
                'email' => $this->email,
                'no_hp' => $this->no_hp,
                'alamat' => $this->alamat,
                'foto_profil' => $this->getPhotoUrl(),
                'actual_poin' => $this->actual_poin ?? 0, // Poin saldo untuk transaksi
                'display_poin' => $this->display_poin ?? 0, // For leaderboard ranking
                'total_setor_sampah' => $this->total_setor_sampah,
                'level' => $this->level,
                'role_id' => $this->role_id,
                'role' => $roleData,
                'permissions' => $permissions,
            ],
        ];
    }

    /**
     * Get the full URL for the profile photo
     */
    private function getPhotoUrl(): ?string
    {
        if (empty($this->foto_profil)) {
            return null;
        }

        // If it's already a full URL (Cloudinary), return as-is
        if (str_starts_with($this->foto_profil, 'http://') || str_starts_with($this->foto_profil, 'https://')) {
            return str_replace('http://', 'https://', $this->foto_profil);
        }

        // Local storage path - file doesn't exist on Railway, return null
        return null;
    }
}
