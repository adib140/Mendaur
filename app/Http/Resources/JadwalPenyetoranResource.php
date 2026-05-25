<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JadwalPenyetoranResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->jadwal_penyetoran_id,
            'jadwal_penyetoran_id' => $this->jadwal_penyetoran_id,
            'hari' => $this->hari,                    // CHANGED: from 'tanggal' to 'hari'
            'waktu_mulai' => $this->waktu_mulai,
            'waktu_selesai' => $this->waktu_selesai,
            'lokasi' => $this->lokasi,
            'status' => $this->status,                // ADDED: 'Buka' or 'Tutup'
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            // REMOVED: 'keterangan', 'kapasitas'
        ];
    }
}
