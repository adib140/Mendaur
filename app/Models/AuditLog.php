<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $primaryKey = 'audit_log_id';
    public $incrementing = true;
    protected $keyType = 'int';
    use HasFactory;

    protected $fillable = [
        'admin_id',       // ID admin yang melakukan aksi
        'action_type',    // Tipe aksi: create, update, delete, approve, reject
        'resource_type',  // Tipe resource: TabungSampah, PenarikanTunai, dll
        'resource_id',    // ID resource yang diubah
        'old_values',     // Nilai sebelum perubahan (JSON)
        'new_values',     // Nilai setelah perubahan (JSON)
        'reason',         // Alasan melakukan aksi
        'ip_address',     // IP address admin
        'user_agent',     // Browser/device info
        'status',         // Status: success, failed
        'error_message',  // Pesan error jika gagal
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id', 'user_id');
    }

    // Log admin action
    public static function logAction(
        User $admin,
        string $actionType,
        string $resourceType,
        int $resourceId,
        array $oldValues = [],
        array $newValues = [],
        string $reason = '',
        bool $success = true,
        ?string $errorMessage = null
    ): self {
        // Get request IP
        $ipAddress = request()->ip();

        // Get user agent
        $userAgent = request()->userAgent();

        return self::create([
            'admin_id' => $admin->id,
            'action_type' => $actionType,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'old_values' => !empty($oldValues) ? $oldValues : null,
            'new_values' => !empty($newValues) ? $newValues : null,
            'reason' => $reason,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'status' => $success ? 'success' : 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    public function scopeByResourceType($query, string $resourceType)
    {
        return $query->where('resource_type', $resourceType);
    }

    public function scopeByAdmin($query, User $admin)
    {
        return $query->where('admin_id', $admin->id);
    }

    public function scopeByActionType($query, string $actionType)
    {
        return $query->where('action_type', $actionType);
    }

    public function scopeSuccessful($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }
}
