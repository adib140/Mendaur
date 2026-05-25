<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PasswordReset extends Model
{
    protected $table = 'password_resets';

    protected $fillable = [
        'email',        // Email user yang request reset
        'token',        // Token reset password
        'otp',          // OTP (6 digit) - plaintext untuk backward compat
        'otp_hash',     // OTP yang di-hash untuk keamanan
        'reset_token',  // Token untuk halaman reset password
        'expires_at',   // Waktu expired
        'verified_at',  // Waktu OTP diverifikasi
        'created_at',   // Waktu dibuat
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public $timestamps = false;

    public function isExpired()
    {
        return Carbon::now()->gt($this->expires_at);
    }

    public function isVerified()
    {
        return !is_null($this->verified_at);
    }

    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', Carbon::now());
    }

    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }
}
