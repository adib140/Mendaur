<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JadwalPenyetoran extends Model
{
    use HasFactory;

    protected $table = 'jadwal_penyetorans';
    protected $primaryKey = 'jadwal_penyetoran_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'hari',
        'waktu_mulai',
        'waktu_selesai',
        'lokasi',
        'status',
    ];

    protected $casts = [];

    public const HARI_OPTIONS = [
        'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
    ];

    public const STATUS_OPTIONS = ['Buka', 'Tutup'];

    public function tabungSampah()
    {
        return $this->hasMany(TabungSampah::class, 'jadwal_penyetoran_id');
    }
}
