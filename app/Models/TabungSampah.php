<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TabungSampah extends Model
{
    use HasFactory;

    protected $table = 'tabung_sampah';
    protected $primaryKey = 'tabung_sampah_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'jadwal_penyetoran_id',
        'nama_lengkap',
        'no_hp',
        'titik_lokasi',
        'jenis_sampah',
        'foto_sampah',
        'foto_sampah_public_id',
        'status',
        'berat_kg',
        'poin_didapat',
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

    public function jadwal()
    {
        return $this->belongsTo(JadwalPenyetoran::class, 'jadwal_penyetoran_id', 'jadwal_penyetoran_id');
    }

    public function poinTransaksi()
    {
        return $this->hasOne(PoinTransaksi::class, 'tabung_sampah_id', 'tabung_sampah_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }
}
