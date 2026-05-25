<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksis';
    protected $primaryKey = 'transaksi_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',     // ID pengguna
        'kategori_id', // ID kategori transaksi
        'jumlah',      // Jumlah/nominal
        'deskripsi',   // Deskripsi transaksi
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // Relasi ke KategoriTransaksi
    public function kategori()
    {
        return $this->belongsTo(KategoriTransaksi::class, 'kategori_id', 'kategori_id');
    }
}
