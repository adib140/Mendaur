<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArtikelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'artikel_id' => $this->artikel_id,
            'judul' => $this->judul,
            'slug' => $this->slug,
            'konten' => $this->konten,
            'foto_cover' => $this->getPhotoUrl(),
            'foto_cover_url' => $this->getPhotoUrl(), // Alias for compatibility
            'penulis' => $this->penulis,
            'kategori' => $this->kategori,
            'views' => $this->views ?? 0,
            'tanggal_publikasi' => $this->tanggal_publikasi?->format('Y-m-d'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Get the full URL for the article cover photo
     * Handles both Cloudinary URLs and local storage paths
     */
    private function getPhotoUrl(): ?string
    {
        if (empty($this->foto_cover)) {
            return null;
        }

        // If it's already a full URL (Cloudinary), return as-is with HTTPS
        if (str_starts_with($this->foto_cover, 'http://') || str_starts_with($this->foto_cover, 'https://')) {
            return str_replace('http://', 'https://', $this->foto_cover);
        }

        // Validate that foto_cover is a valid file path
        if (!preg_match('/^[\w\-\.\/]+$/', $this->foto_cover)) {
            return null;
        }

        // Otherwise, it's a local storage path - convert to full URL
        return secure_asset('storage/' . $this->foto_cover);
    }
}
