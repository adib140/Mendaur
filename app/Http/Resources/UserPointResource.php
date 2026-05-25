<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserPointResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'actual_poin' => $this->actual_poin,
            'level' => $this->level,
            'foto_profil' => $this->foto_profil,
            'total_setor_sampah' => $this->total_setor_sampah,
        ];
    }
}
