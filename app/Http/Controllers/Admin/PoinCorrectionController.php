<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PoinCorrection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PoinCorrectionController extends Controller
{
    // PATCH /api/admin/users/{userId}/poin
    public function updatePoin(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();

            // Authorization: Superadmin only
            if (!$currentUser->isSuperAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden',
                    'error' => 'Only superadmin can correct poin values'
                ], 403);
            }

            if (!is_numeric($userId) || $userId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid user ID'
                ], 422);
            }

            $validated = $request->validate([
                'new_poin' => 'required|integer|min:0|max:999999',
                'reason' => 'required|string|min:10|max:500',
                'type' => 'nullable|in:correction,reversal,fraud_prevention,system_fix',
                'notes' => 'nullable|string|max:1000',
            ]);

            $targetUser = User::where('user_id', $userId)
                ->where('deleted_at', null)
                ->first();

            if (!$targetUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User not found'
                ], 404);
            }

            // Cannot correct own poin
            if ($currentUser->user_id == $userId) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Error',
                    'error' => 'Superadmin cannot correct their own poin'
                ], 403);
            }

            $oldPoin = $targetUser->actual_poin;
            $newPoin = $validated['new_poin'];

            if ($oldPoin === $newPoin) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Poin value unchanged',
                    'data' => [
                        'user_id' => (int) $targetUser->user_id,
                        'old_poin' => $oldPoin,
                        'new_poin' => $newPoin,
                        'difference' => 0,
                    ]
                ], 200);
            }

            // Use transaction to ensure atomicity
            DB::beginTransaction();

            try {
                // Create poin correction record
                $correction = PoinCorrection::recordCorrection(
                    superadminId: $currentUser->user_id,
                    nasabahId: $targetUser->user_id,
                    oldValue: $oldPoin,
                    newValue: $newPoin,
                    reason: $validated['reason'],
                    type: $validated['type'] ?? 'correction',
                    status: 'approved',
                    notes: $validated['notes'] ?? null
                );

                // Update user's poin (both actual and display for consistency)
                $targetUser->update([
                    'actual_poin' => $newPoin,
                    'display_poin' => $newPoin,
                ]);

                // Log in audit_logs table as well
                $type = $validated['type'] ?? 'correction';
                DB::table('audit_logs')->insert([
                    'admin_id' => $currentUser->user_id,
                    'user_id' => $targetUser->user_id,
                    'action' => 'poin_correction',
                    'old_value' => $oldPoin,
                    'new_value' => $newPoin,
                    'description' => "Poin corrected from {$oldPoin} to {$newPoin}. Type: {$type}. Reason: {$validated['reason']}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::commit();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Poin corrected successfully',
                    'data' => [
                        'correction_id' => (int) $correction->poin_correction_id,
                        'user_id' => (int) $targetUser->user_id,
                        'old_poin' => $oldPoin,
                        'new_poin' => $newPoin,
                        'difference' => $newPoin - $oldPoin,
                        'type' => $validated['type'] ?? 'correction',
                        'reason' => $validated['reason'],
                        'corrected_by' => $currentUser->nama,
                        'corrected_at' => $correction->created_at->toIso8601String(),
                    ]
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to correct poin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/poin-corrections
    public function listCorrections(Request $request)
    {
        try {
            $currentUser = $request->user();

            // Authorization: Superadmin only
            if (!$currentUser->isSuperAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden',
                    'error' => 'Only superadmin can view poin corrections'
                ], 403);
            }

            $validated = $request->validate([
                'page' => 'nullable|integer|min:1',
                'limit' => 'nullable|integer|min:1|max:100',
                'nasabah_id' => 'nullable|integer|exists:users,user_id',
                'superadmin_id' => 'nullable|integer|exists:users,user_id',
                'type' => 'nullable|in:correction,reversal,fraud_prevention,system_fix',
                'start_date' => 'nullable|date_format:Y-m-d',
                'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
                'is_reversed' => 'nullable|boolean',
            ]);

            $query = PoinCorrection::query();

            // Apply filters
            if (!empty($validated['nasabah_id'])) {
                $query->where('nasabah_id', $validated['nasabah_id']);
            }

            if (!empty($validated['superadmin_id'])) {
                $query->where('superadmin_id', $validated['superadmin_id']);
            }

            if (!empty($validated['type'])) {
                $query->where('type', $validated['type']);
            }

            if (!empty($validated['start_date'])) {
                $query->where('created_at', '>=', $validated['start_date'] . ' 00:00:00');
            }

            if (!empty($validated['end_date'])) {
                $query->where('created_at', '<=', $validated['end_date'] . ' 23:59:59');
            }

            if (isset($validated['is_reversed'])) {
                $query->where('is_reversed', $validated['is_reversed']);
            }

            $limit = min($validated['limit'] ?? 10, 100);
            $page = $validated['page'] ?? 1;
            $total = $query->count();
            $offset = ($page - 1) * $limit;
            $totalPages = ceil($total / $limit);

            $corrections = $query
                ->orderBy('created_at', 'DESC')
                ->offset($offset)
                ->limit($limit)
                ->with(['superAdmin:user_id,nama,email', 'nasabah:user_id,nama,email'])
                ->get();

            $correctionData = $corrections->map(function ($correction) {
                return [
                    'correction_id' => (int) $correction->poin_correction_id,
                    'nasabah' => [
                        'user_id' => (int) $correction->nasabah_id,
                        'nama' => $correction->nasabah?->nama ?? 'Unknown',
                        'email' => $correction->nasabah?->email ?? 'Unknown',
                    ],
                    'superadmin' => [
                        'user_id' => (int) $correction->superadmin_id,
                        'nama' => $correction->superAdmin?->nama ?? 'Unknown',
                        'email' => $correction->superAdmin?->email ?? 'Unknown',
                    ],
                    'old_value' => (int) $correction->old_value,
                    'new_value' => (int) $correction->new_value,
                    'difference' => (int) $correction->difference,
                    'type' => $correction->type,
                    'reason' => $correction->reason,
                    'notes' => $correction->notes,
                    'status' => $correction->status,
                    'is_reversed' => (bool) $correction->is_reversed,
                    'reversed_at' => $correction->reversed_at?->toIso8601String(),
                    'created_at' => $correction->created_at->toIso8601String(),
                ];
            })->toArray();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'corrections' => $correctionData,
                    'pagination' => [
                        'currentPage' => $page,
                        'totalPages' => $totalPages,
                        'totalCorrections' => $total,
                        'limit' => $limit,
                        'hasNextPage' => $page < $totalPages,
                        'hasPrevPage' => $page > 1,
                    ]
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch poin corrections',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/poin-corrections/{id}
    public function showCorrection(Request $request, $correctionId)
    {
        try {
            $currentUser = $request->user();

            // Authorization: Superadmin only
            if (!$currentUser->isSuperAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden'
                ], 403);
            }

            if (!is_numeric($correctionId) || $correctionId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid correction ID'
                ], 422);
            }

            $correction = PoinCorrection::with([
                'superAdmin:user_id,nama,email',
                'nasabah:user_id,nama,email',
                'reversedByUser:user_id,nama,email'
            ])->find($correctionId);

            if (!$correction) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Correction not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'correction_id' => (int) $correction->poin_correction_id,
                    'nasabah' => [
                        'user_id' => (int) $correction->nasabah_id,
                        'nama' => $correction->nasabah?->nama,
                        'email' => $correction->nasabah?->email,
                    ],
                    'superadmin' => [
                        'user_id' => (int) $correction->superadmin_id,
                        'nama' => $correction->superAdmin?->nama,
                        'email' => $correction->superAdmin?->email,
                    ],
                    'old_value' => (int) $correction->old_value,
                    'new_value' => (int) $correction->new_value,
                    'difference' => (int) $correction->difference,
                    'type' => $correction->type,
                    'reason' => $correction->reason,
                    'notes' => $correction->notes,
                    'status' => $correction->status,
                    'is_reversed' => (bool) $correction->is_reversed,
                    'reversed_by' => $correction->reversedByUser?->nama,
                    'reversed_at' => $correction->reversed_at?->toIso8601String(),
                    'created_at' => $correction->created_at->toIso8601String(),
                    'audit_trail' => $correction->getAuditTrail(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch correction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/admin/poin-corrections/{id}/reverse
    public function reverseCorrection(Request $request, $correctionId)
    {
        try {
            $currentUser = $request->user();

            // Authorization: Superadmin only
            if (!$currentUser->isSuperAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden'
                ], 403);
            }

            if (!is_numeric($correctionId) || $correctionId <= 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid correction ID'
                ], 422);
            }

            $validated = $request->validate([
                'reason' => 'nullable|string|max:500',
            ]);

            $correction = PoinCorrection::find($correctionId);

            if (!$correction) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Correction not found'
                ], 404);
            }

            if (!$correction->canBeReversed()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot reverse this correction',
                    'error' => 'Correction is either already reversed or not approved'
                ], 422);
            }

            // Use transaction to ensure atomicity
            DB::beginTransaction();

            try {
                // Reverse the correction record
                $correction->reverse($currentUser->user_id, $validated['reason'] ?? null);

                // Restore nasabah's poin to original value
                $nasabah = User::find($correction->nasabah_id);
                if ($nasabah) {
                    $nasabah->update(['total_poin' => $correction->old_value]);

                    // Log the reversal
                    DB::table('audit_logs')->insert([
                        'admin_id' => $currentUser->user_id,
                        'user_id' => $nasabah->user_id,
                        'action' => 'poin_correction_reversed',
                        'old_value' => $correction->new_value,
                        'new_value' => $correction->old_value,
                        'description' => "Poin correction reversed. Restored from {$correction->new_value} to {$correction->old_value}. Reason: " . ($validated['reason'] ?? 'No reason'),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::commit();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Poin correction reversed successfully',
                    'data' => [
                        'correction_id' => (int) $correction->poin_correction_id,
                        'restored_poin' => (int) $correction->old_value,
                        'reversed_at' => $correction->reversed_at->toIso8601String(),
                    ]
                ], 200);

            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reverse correction',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/poin-corrections/stats
    public function getStats(Request $request)
    {
        try {
            $currentUser = $request->user();

            // Authorization: Superadmin only
            if (!$currentUser->isSuperAdmin()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Forbidden'
                ], 403);
            }

            $validated = $request->validate([
                'start_date' => 'nullable|date_format:Y-m-d',
                'end_date' => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            ]);

            $query = PoinCorrection::query();

            if (!empty($validated['start_date'])) {
                $query->where('created_at', '>=', $validated['start_date'] . ' 00:00:00');
            }

            if (!empty($validated['end_date'])) {
                $query->where('created_at', '<=', $validated['end_date'] . ' 23:59:59');
            }

            $stats = [
                'total_corrections' => $query->count(),
                'total_reversed' => $query->clone()->where('is_reversed', true)->count(),
                'total_active' => $query->clone()->where('is_reversed', false)->count(),
                'total_poin_added' => (int) $query->clone()->where('difference', '>', 0)->sum('difference'),
                'total_poin_removed' => abs((int) $query->clone()->where('difference', '<', 0)->sum('difference')),
                'by_type' => $query->clone()
                    ->selectRaw('type, COUNT(*) as count, SUM(difference) as total_difference')
                    ->groupBy('type')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'type' => $item->type,
                            'count' => (int) $item->count,
                            'total_difference' => (int) $item->total_difference,
                        ];
                    })
                    ->toArray(),
                'affected_users' => $query->clone()->distinct('nasabah_id')->count('nasabah_id'),
                'by_superadmin' => $query->clone()
                    ->selectRaw('superadmin_id, COUNT(*) as count')
                    ->groupBy('superadmin_id')
                    ->with('superAdmin:user_id,nama')
                    ->get()
                    ->map(function ($item) {
                        return [
                            'superadmin_id' => (int) $item->superadmin_id,
                            'superadmin_name' => $item->superAdmin?->nama,
                            'count' => (int) $item->count,
                        ];
                    })
                    ->toArray(),
            ];

            return response()->json([
                'status' => 'success',
                'data' => $stats
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
