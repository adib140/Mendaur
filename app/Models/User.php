<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    protected $primaryKey = 'user_id';
    public $incrementing = true;
    protected $keyType = 'int';

    use HasFactory, Notifiable, HasApiTokens, SoftDeletes;

    protected $fillable = [
        'nama',
        'email',
        'password',
        'no_hp',
        'alamat',
        'foto_profil',
        'foto_profil_public_id',
        'display_poin',
        'actual_poin',
        'total_setor_sampah',
        'level',
        'role_id',
        'status',
        'tipe_nasabah',
        'nama_bank',
        'nomor_rekening',
        'atas_nama_rekening',
        'badge_title_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'deleted_at' => 'datetime',
            'password' => 'hashed',
            'tipe_nasabah' => 'string',
            'display_poin' => 'integer',
            'actual_poin' => 'integer',
            'total_setor_sampah' => 'decimal:2',
        ];
    }

    protected $attributes = [
        'tipe_nasabah' => 'konvensional',
        'display_poin' => 0,
        'actual_poin' => 0,
        'total_setor_sampah' => 0,
        'status' => 'active',
    ];

    // Relationships

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class, 'admin_id', 'user_id');
    }

    public function tabungSampahs()
    {
        return $this->hasMany(TabungSampah::class, 'user_id', 'user_id');
    }

    public function penukaranProduk()
    {
        return $this->hasMany(PenukaranProduk::class, 'user_id', 'user_id');
    }

    public function penarikanTunai()
    {
        return $this->hasMany(PenarikanTunai::class, 'user_id', 'user_id');
    }

    public function poinTransaksis()
    {
        return $this->hasMany(PoinTransaksi::class, 'user_id', 'user_id');
    }

    public function badges()
    {
        return $this->belongsToMany(
            Badge::class,
            'user_badges',
            'user_id',
            'badge_id'
        )->withPivot('tanggal_dapat')->withTimestamps();
    }

    public function userBadges()
    {
        return $this->hasMany(UserBadge::class, 'user_id', 'user_id');
    }

    public function badgeTitle()
    {
        return $this->belongsTo(Badge::class, 'badge_title_id', 'badge_id');
    }

    public function badgeProgress()
    {
        return $this->hasMany(BadgeProgress::class, 'user_id', 'user_id');
    }

    public function notifikasis()
    {
        return $this->hasMany(Notifikasi::class, 'user_id', 'user_id');
    }

    public function logAktivitas()
    {
        return $this->hasMany(LogAktivitas::class, 'user_id', 'user_id');
    }

    public function isAdminUser(): bool
    {
        return in_array($this->level, [2, 3]) ||
               in_array($this->role?->nama_role, ['admin', 'superadmin']);
    }

    public function isSuperAdmin(): bool
    {
        return $this->level === 3 || $this->role?->nama_role === 'superadmin';
    }

    public function isModernNasabah(): bool
    {
        return true; // Semua nasabah dianggap modern untuk saat ini
    }

    public function getUsablePoin(): int
    {
        return $this->actual_poin ?? 0;
    }

    public function getIdAttribute()
    {
        return $this->user_id;
    }
}
