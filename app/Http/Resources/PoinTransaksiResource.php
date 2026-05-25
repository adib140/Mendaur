<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PoinTransaksiResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tanggal' => $this->created_at->format('Y-m-d'),
            'waktu' => $this->created_at->format('H:i:s'),
            'sumber' => $this->sumber,
            'sumber_label' => $this->getSourceLabel(),
            'jenis_sampah' => $this->jenis_sampah,
            'berat_kg' => $this->berat_kg ? (float) $this->berat_kg : null,
            'poin_didapat' => $this->poin_didapat,
            'tipe' => $this->poin_didapat > 0 ? 'earning' : 'spending',
            'keterangan' => $this->keterangan,
            'referensi' => $this->when($this->referensi_id, [
                'id' => $this->referensi_id,
                'tipe' => $this->referensi_tipe,
            ]),
        ];
    }
}
