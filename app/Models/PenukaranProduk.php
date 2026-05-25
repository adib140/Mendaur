<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PenukaranProduk extends Model
{
    use HasFactory;

    protected $table = 'penukaran_produk';
    protected $primaryKey = 'penukaran_produk_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'produk_id',
        'nama_produk',
        'poin_digunakan',
        'jumlah',
        'status',
        'metode_ambil',
        'catatan',
        'tanggal_penukaran',
        'tanggal_diambil',
    ];

    protected $casts = [
        'poin_digunakan' => 'integer',
        'jumlah' => 'integer',
        'tanggal_penukaran' => 'datetime',
        'tanggal_diambil' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_id', 'produk_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApprove($query)
    {
        return $query->whereIn('status', ['approved']);
    }

    public function scopeCanceled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeStatuses($query, array $statuses)
    {
        return $query->whereIn('status', $statuses);
    }

    public function scopeExcludeStatus($query, $status)
    {
        return $query->where('status', '!=', $status);
    }

    public function scopeExcludeStatuses($query, array $statuses)
    {
        return $query->whereNotIn('status', $statuses);
    }
}
