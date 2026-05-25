<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PenarikanTunai extends Model
{
    use HasFactory;

    protected $table = 'penarikan_tunai';
    protected $primaryKey = 'penarikan_tunai_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'jumlah_poin',
        'jumlah_rupiah',
        'nomor_rekening',
        'nama_bank',
        'nama_penerima',
        'status',
        'catatan_admin',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'jumlah_poin' => 'integer',
        'jumlah_rupiah' => 'decimal:2',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by', 'user_id');
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
