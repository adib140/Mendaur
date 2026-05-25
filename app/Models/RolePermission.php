<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    protected $primaryKey = 'role_permission_id';
    public $incrementing = true;
    protected $keyType = 'int';
    use HasFactory;

    protected $fillable = [
        'role_id',         // ID role
        'permission_code', // Kode permission: manage_users, approve_deposits, dll
        'deskripsi',       // Deskripsi permission
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    public function scopeByRoleName($query, string $roleName)
    {
        return $query->whereHas('role', function ($q) use ($roleName) {
            $q->where('nama_role', $roleName);
        });
    }
}
