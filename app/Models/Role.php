<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $primaryKey = 'role_id';
    public $incrementing = true;
    protected $keyType = 'int';
    use HasFactory;

    protected $fillable = [
        'nama_role',    // Nama role: nasabah, admin, superadmin
        'level_akses',  // Level akses: 1=nasabah, 2=admin, 3=superadmin
        'deskripsi',    // Deskripsi role
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'role_id', 'role_id');
    }

    public function permissions()
    {
        return $this->hasMany(RolePermission::class, 'role_id', 'role_id');
    }

    public function hasPermission(string $permissionCode): bool
    {
        return $this->permissions()
            ->where('permission_code', $permissionCode)
            ->exists();
    }

    public function getPermissionCodes(): array
    {
        return $this->permissions()
            ->pluck('permission_code')
            ->toArray();
    }

    public function getInheritedPermissions()
    {
        $currentLevel = $this->level_akses;

        // Get all roles at current level and below
        $inheritedRoles = Role::where('level_akses', '<=', $currentLevel)->get();

        // Collect all permissions
        $permissions = collect();
        foreach ($inheritedRoles as $role) {
            $permissions = $permissions->concat($role->permissions);
        }

        return $permissions->unique('permission_code');
    }

    public static function getByName(string $name): ?self
    {
        return self::where('nama_role', $name)->first();
    }
}
