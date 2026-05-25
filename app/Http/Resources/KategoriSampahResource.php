<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KategoriSampahResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [
            'kategori_sampah_id' => $this->kategori_sampah_id,
            'nama_kategori' => $this->nama_kategori,
            'deskripsi' => $this->deskripsi,
            'icon' => $this->icon,
            'warna' => $this->warna,
            'is_active' => $this->is_active,
            'jenis_sampah' => JenisSampahResource::collection($this->whenLoaded('activeJenisSampah')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
