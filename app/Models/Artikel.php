<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Artikel extends Model
{
    use HasFactory;

    protected $table = 'artikels';
    protected $primaryKey = 'artikel_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'judul',
        'slug',
        'konten',
        'foto_cover',
        'foto_cover_public_id',
        'penulis',
        'kategori',
        'tanggal_publikasi',
        'views',
    ];

    protected $casts = [
        'tanggal_publikasi' => 'date',
        'views' => 'integer',
    ];
}
