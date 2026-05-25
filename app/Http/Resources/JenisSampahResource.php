<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JenisSampahResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [
            'jenis_sampah_id' => $this->jenis_sampah_id,
            'kategori_sampah_id' => $this->kategori_sampah_id,
            'nama_jenis' => $this->nama_jenis,
            'harga_per_kg' => $this->harga_per_kg,
            'satuan' => $this->satuan,
            'kode' => $this->kode,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
