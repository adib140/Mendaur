<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'role_id' => $this->role_id,
            'no_hp' => $this->no_hp,
            'nama' => $this->nama,
            'email' => $this->email,
            'alamat' => $this->alamat,
            'foto_profil' => $this->getPhotoUrl(),
            'actual_poin' => $this->actual_poin ?? 0,
            'display_poin' => $this->display_poin ?? 0,
            'total_setor_sampah' => $this->total_setor_sampah,
            'level' => $this->level,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function getPhotoUrl(): ?string
    {
        if (empty($this->foto_profil)) {
            return null;
        }


        if (str_starts_with($this->foto_profil, 'http://') || str_starts_with($this->foto_profil, 'https://')) {
            return str_replace('http://', 'https://', $this->foto_profil);
        }

        // Validate path format
        if (!preg_match('/^[\w\-\.\/]+$/', $this->foto_profil)) {
            return null;
        }

        return secure_asset('storage/' . $this->foto_profil);
    }
}
