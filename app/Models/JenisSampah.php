<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JenisSampah extends Model
{
    use HasFactory;

    protected $table = 'jenis_sampah';
    protected $primaryKey = 'jenis_sampah_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'kategori_sampah_id',
        'nama_jenis',
        'harga_per_kg',
        'satuan',
        'kode',
        'is_active',
    ];

    protected $casts = [
        'harga_per_kg' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function kategori()
    {
        return $this->belongsTo(KategoriSampah::class, 'kategori_sampah_id');
    }

    public function getFullNameAttribute()
    {
        return $this->kategori->nama_kategori . ' - ' . $this->nama_jenis;
    }

    public function scopeAktif($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByKategori($query, $kategoriId)
    {
        return $query->where('kategori_sampah_id', $kategoriId);
    }

    public function getFormattedPriceAttribute()
    {
        return 'Rp ' . number_format($this->harga_per_kg, 0, ',', '.');
    }
}
