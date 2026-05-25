<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PoinTransaksi extends Model
{
    use HasFactory;

    protected $table = 'poin_transaksis';
    protected $primaryKey = 'poin_transaksi_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'tabung_sampah_id',
        'jenis_sampah',
        'berat_kg',
        'poin_didapat',
        'sumber',
        'keterangan',
        'referensi_id',
        'referensi_tipe',
    ];

    protected $casts = [
        'berat_kg' => 'decimal:2',
        'poin_didapat' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function tabungSampah()
    {
        return $this->belongsTo(TabungSampah::class, 'tabung_sampah_id', 'tabung_sampah_id');
    }

    public function scopeBySumber($query, $sumber)
    {
        return $query->where('sumber', $sumber);
    }

    public function scopeDeposits($query)
    {
        return $query->where('sumber', 'setor_sampah');
    }

    public function scopeBonuses($query)
    {
        return $query->where('sumber', 'bonus');
    }

    public function scopePositive($query)
    {
        return $query->where('poin_didapat', '>', 0);
    }

    public function scopeNegative($query)
    {
        return $query->where('poin_didapat', '<', 0);
    }
}
