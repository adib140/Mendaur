<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UserBadge extends Model
{
    use HasFactory;

    protected $table = 'user_badges';
    protected $primaryKey = 'user_badge_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'user_id',
        'badge_id',
        'tanggal_dapat',
        'reward_claimed',
    ];

    protected $casts = [
        'tanggal_dapat' => 'datetime',
        'reward_claimed' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function badge()
    {
        return $this->belongsTo(Badge::class, 'badge_id', 'badge_id');
    }

    public function getIdAttribute()
    {
        return $this->user_badge_id;
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('tanggal_dapat', [$startDate, $endDate]);
    }

    public function scopeRecent($query, $days = 7)
    {
        return $query->where('tanggal_dapat', '>=', now()->subDays($days))
                     ->orderByDesc('tanggal_dapat');
    }
}
