<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    use HasFactory;

    protected $table = 'produks';
    protected $primaryKey = 'produk_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nama',
        'deskripsi',
        'harga_poin',
        'stok',
        'kategori',
        'foto',
        'foto_public_id',
        'status',
    ];

    protected $casts = [
        'harga_poin' => 'integer',
        'stok' => 'integer',
    ];

    public function transaksis()
    {
        return $this->hasMany(Transaksi::class, 'produk_id');
    }
}
