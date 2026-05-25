<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PenarikanTunaiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'penarikan_tunai_id' => $this->penarikan_tunai_id,
            'user_id' => $this->user_id,
            'jumlah_poin' => $this->jumlah_poin,
            'jumlah_rupiah' => $this->jumlah_rupiah,
            'metode' => $this->metode,
            'nama_bank' => $this->nama_bank,
            'nomor_rekening' => $this->nomor_rekening,
            'atas_nama' => $this->atas_nama,
            'status' => $this->status,
            'processed_by' => $this->processed_by,
            'processed_at' => $this->processed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
