<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KategoriSampah extends Model
{
    use HasFactory;

    protected $table = 'kategori_sampah';
    protected $primaryKey = 'kategori_sampah_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nama_kategori',
        'deskripsi',
        'icon',
        'warna',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function jenisSampah()
    {
        return $this->hasMany(JenisSampah::class, 'kategori_sampah_id');
    }

    public function activeJenisSampah()
    {
        return $this->hasMany(JenisSampah::class, 'kategori_sampah_id')
                    ->where('is_active', true);
    }
}
