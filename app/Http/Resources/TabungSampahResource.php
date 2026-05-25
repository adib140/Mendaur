<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TabungSampahResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'tabung_sampah_id' => $this->tabung_sampah_id,
            'user_id' => $this->user_id,
            'jadwal_penyetoran_id' => $this->jadwal_penyetoran_id,
            'jenis_sampah' => $this->jenis_sampah,
            'berat_kg' => $this->berat_kg,
            'status' => $this->status,
            'poin_didapat' => $this->poin_didapat,
            'foto_sampah' => $this->getPhotoUrl(),
            'foto_sampah_url' => $this->getPhotoUrl(),
            'nama_lengkap' => $this->nama_lengkap,
            'no_hp' => $this->no_hp,
            'titik_lokasi' => $this->titik_lokasi,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function getPhotoUrl(): ?string
    {
        if (empty($this->foto_sampah)) {
            return null;
        }

        if (str_starts_with($this->foto_sampah, 'http://') || str_starts_with($this->foto_sampah, 'https://')) {
            return str_replace('http://', 'https://', $this->foto_sampah);
        }

        // Validate path format
        if (!preg_match('/^[\w\-\.\/]+$/', $this->foto_sampah)) {
            return null;
        }

        return secure_asset('storage/' . $this->foto_sampah);
    }
}
