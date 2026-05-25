<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PenukaranProdukResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->penukaran_produk_id,
            'produk' => [
                'id' => $this->produk?->produk_id,
                'nama' => $this->produk?->nama,
                'deskripsi' => $this->produk?->deskripsi,
                'foto' => $this->getProductPhotoUrl(),
                'foto_url' => $this->getProductPhotoUrl(),
                'harga_poin' => $this->produk?->harga_poin,
            ],
            'poin_digunakan' => $this->poin_digunakan,
            'jumlah' => $this->jumlah,
            'metode_ambil' => $this->metode_ambil,
            'metode_label' => $this->metode_ambil === 'pickup' ? 'Ambil di Lokasi' : 'Pengiriman',
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'tanggal_penukaran' => $this->created_at?->format('Y-m-d'),
            'tanggal_diambil' => $this->tanggal_diambil?->format('Y-m-d'),
            'catatan_admin' => $this->catatan,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function getStatusLabel(): string
    {
        $labels = [
            'pending' => 'Menunggu Persetujuan',
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'cancelled' => 'Dibatalkan',
            'completed' => 'Selesai',
        ];

        return $labels[$this->status] ?? $this->status;
    }

    private function getProductPhotoUrl(): ?string
    {
        $foto = $this->produk?->foto;

        if (empty($foto)) {
            return null;
        }

        // If it's already a full URL (Cloudinary), return as-is with HTTPS
        if (str_starts_with($foto, 'http://') || str_starts_with($foto, 'https://')) {
            return str_replace('http://', 'https://', $foto);
        }

        // Validate path format
        if (!preg_match('/^[\w\-\.\/]+$/', $foto)) {
            return null;
        }

        return secure_asset('storage/' . $foto);
    }
}
