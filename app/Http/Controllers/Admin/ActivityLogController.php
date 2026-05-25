<?php

namespace App\Http\Controllers\Admin;

use App\Models\LogAktivitas;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ActivityLogController extends Controller
{
    // GET /api/admin/users/{id}/activity-logs
    public function userActivityLogs(Request $request, $userId)
    {
        // Check authorization - must be admin or superadmin
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            // Verify user exists
            $user = User::findOrFail($userId);

            // Get activity logs with pagination
            $perPage = $request->query('per_page', 20);
            $activityLogs = LogAktivitas::where('user_id', $userId)
                ->orderBy('tanggal', 'desc')
                ->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'user_id' => $user->user_id,
                        'nama' => $user->nama,
                        'email' => $user->email
                    ],
                    'activity_logs' => $activityLogs
                ]
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/activity-logs
    public function allActivityLogs(Request $request)
    {
        // Check authorization
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $perPage = $request->query('per_page', 50);

            // Get filter parameters
            $userId = $request->query('user_id');
            $activityType = $request->query('activity_type');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');

            $query = LogAktivitas::with('user');

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($activityType) {
                $query->where('tipe_aktivitas', $activityType);
            }

            if ($dateFrom) {
                $query->whereDate('tanggal', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('tanggal', '<=', $dateTo);
            }

            $activityLogs = $query->orderBy('tanggal', 'desc')->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $activityLogs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/activity-logs/stats
    public function activityStats(Request $request)
    {
        // Check authorization
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');

            $query = LogAktivitas::query();

            if ($dateFrom) {
                $query->whereDate('tanggal', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('tanggal', '<=', $dateTo);
            }

            // Get activity type distribution
            $activityDistribution = $query->groupBy('tipe_aktivitas')
                ->selectRaw('tipe_aktivitas, COUNT(*) as count')
                ->get();

            // Get total activities
            $totalActivities = LogAktivitas::count();

            // Get point changes summary
            $pointChanges = LogAktivitas::selectRaw('SUM(poin_perubahan) as total_points_changed')
                ->when($dateFrom, fn($q) => $q->whereDate('tanggal', '>=', $dateFrom))
                ->when($dateTo, fn($q) => $q->whereDate('tanggal', '<=', $dateTo))
                ->first();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_activities' => $totalActivities,
                    'activity_distribution' => $activityDistribution,
                    'total_points_changed' => $pointChanges->total_points_changed ?? 0
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch activity statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/activity-logs/{id}
    public function show(Request $request, $logId)
    {
        // Check authorization
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $activityLog = LogAktivitas::with('user')->findOrFail($logId);

            return response()->json([
                'status' => 'success',
                'data' => $activityLog
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Activity log not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch activity log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/activity-logs/export/csv
    public function exportCsv(Request $request)
    {
        // Check authorization
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized. Admin access required.'
            ], 403);
        }

        try {
            $userId = $request->query('user_id');
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');

            $query = LogAktivitas::with('user');

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($dateFrom) {
                $query->whereDate('tanggal', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('tanggal', '<=', $dateTo);
            }

            $logs = $query->orderBy('tanggal', 'desc')->get();

            // Create CSV content
            $csv = "Log ID,User ID,User Name,Activity Type,Description,Points Changed,Date\n";

            foreach ($logs as $log) {
                $csv .= "{$log->log_user_activity_id},{$log->user_id},{$log->user->nama},";
                $csv .= "{$log->tipe_aktivitas},\"{$log->deskripsi}\",{$log->poin_perubahan},";
                $csv .= "{$log->tanggal->format('Y-m-d H:i:s')}\n";
            }

            return response($csv, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="activity_logs_' . now()->format('Y-m-d_His') . '.csv"'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
