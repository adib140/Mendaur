<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PoinCorrection extends Model
{
    use SoftDeletes;

    protected $table = 'poin_corrections';
    protected $primaryKey = 'poin_correction_id';
    public $incrementing = true;

    protected $fillable = [
        'superadmin_id',
        'nasabah_id',
        'old_value',
        'new_value',
        'difference',
        'reason',
        'type',
        'notes',
        'is_reversed',
        'reversed_by',
        'reversed_at',
        'status',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
        'reversed_at',
    ];

    protected $casts = [
        'old_value' => 'integer',
        'new_value' => 'integer',
        'difference' => 'integer',
        'is_reversed' => 'boolean',
    ];

    public function superAdmin()
    {
        return $this->belongsTo(User::class, 'superadmin_id', 'user_id')
            ->where('level', 3);
    }

    public function nasabah()
    {
        return $this->belongsTo(User::class, 'nasabah_id', 'user_id')
            ->where('level', 1);
    }

    public function reversedByUser()
    {
        return $this->belongsTo(User::class, 'reversed_by', 'user_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_reversed', false)
            ->orWhereNull('is_reversed');
    }

    public function scopeReversed($query)
    {
        return $query->where('is_reversed', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForNasabah($query, $nasabahId)
    {
        return $query->where('nasabah_id', $nasabahId);
    }

    public function scopeByAdmin($query, $superadminId)
    {
        return $query->where('superadmin_id', $superadminId);
    }

    public function scopeInDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public static function recordCorrection(
        int $superadminId,
        int $nasabahId,
        int $oldValue,
        int $newValue,
        string $reason,
        string $type = 'correction',
        string $status = 'approved',
        ?string $notes = null
    )
    {
        $difference = $newValue - $oldValue;

        return self::create([
            'superadmin_id' => $superadminId,
            'nasabah_id' => $nasabahId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'difference' => $difference,
            'reason' => $reason,
            'type' => $type,
            'status' => $status,
            'notes' => $notes,
            'is_reversed' => false,
        ]);
    }

    public function reverse(int $reversedBySuperadminId, ?string $reason = null)
    {
        if ($this->is_reversed) {
            return false; // Already reversed
        }

        $this->update([
            'is_reversed' => true,
            'reversed_by' => $reversedBySuperadminId,
            'reversed_at' => now(),
            'status' => 'reversed',
            'notes' => ($this->notes ?? '') . "\n\nReversed: " . ($reason ?? 'No reason provided'),
        ]);

        return true;
    }

    public function getDisplayName(): string
    {
        $nasabahName = optional($this->nasabah)->nama ?? "User #{$this->nasabah_id}";
        $direction = $this->difference >= 0 ? '+' : '';

        return "{$nasabahName}: {$direction}{$this->difference} poin ({$this->type})";
    }

    public function getAuditTrail(): string
    {
        $superadminName = optional($this->superAdmin)->nama ?? "Admin #{$this->superadmin_id}";
        $nasabahName = optional($this->nasabah)->nama ?? "User #{$this->nasabah_id}";

        $trail = "{$superadminName} corrected {$nasabahName}'s poin from {$this->old_value} to {$this->new_value} ({$this->type}). ";
        $trail .= "Reason: {$this->reason}. ";

        if ($this->notes) {
            $trail .= "Notes: {$this->notes}. ";
        }

        if ($this->is_reversed) {
            $reversedByName = optional($this->reversedByUser)->nama ?? "Admin #{$this->reversed_by}";
            $trail .= "Reversed by {$reversedByName} on {$this->reversed_at->format('Y-m-d H:i:s')}";
        }

        return $trail;
    }

    public function canBeReversed(): bool
    {
        return !$this->is_reversed && $this->status === 'approved';
    }

    public static function getSummaryStats(?int $startDate = null, ?int $endDate = null)
    {
        $query = self::active();

        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate);
        }

        return [
            'total_corrections' => $query->count(),
            'total_poin_added' => $query->where('difference', '>', 0)->sum('difference'),
            'total_poin_removed' => abs($query->where('difference', '<', 0)->sum('difference')),
            'by_type' => $query->groupBy('type')->selectRaw('type, COUNT(*) as count, SUM(difference) as total_diff')->get(),
        ];
    }
}
