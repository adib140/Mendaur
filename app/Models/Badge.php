<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Badge extends Model
{
    protected $table = 'badges';
    protected $primaryKey = 'badge_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'nama',
        'deskripsi',
        'icon',
        'syarat_poin',
        'syarat_setor',
        'reward_poin',
        'tipe',
    ];

    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'user_badges',
            'badge_id',
            'user_id'
        )->withPivot('tanggal_dapat')->withTimestamps();
    }

    public function userBadges()
    {
        return $this->hasMany(UserBadge::class, 'badge_id', 'badge_id');
    }

    public function badgeProgress()
    {
        return $this->hasMany(BadgeProgress::class, 'badge_id', 'badge_id');
    }

    public function getIdAttribute()
    {
        return $this->badge_id;
    }
}
