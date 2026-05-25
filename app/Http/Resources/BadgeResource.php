<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BadgeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'badge_id' => $this->badge_id,
            'nama' => $this->nama,
            'deskripsi' => $this->deskripsi,
            'icon' => $this->icon,
            'syarat_poin' => $this->syarat_poin,
            'syarat_setor' => $this->syarat_setor,
            'reward_poin' => $this->reward_poin,
            'tipe' => $this->tipe,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
