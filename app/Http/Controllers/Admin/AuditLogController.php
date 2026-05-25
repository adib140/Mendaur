<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    // GET /api/admin/audit-logs
    public function index(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $query = DB::table('audit_logs')->orderBy('created_at', 'desc');

            // Filter by user if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            // Filter by action if provided
            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            // Filter by date range if provided
            if ($request->has('from_date') && $request->has('to_date')) {
                $query->whereBetween('created_at', [
                    $request->from_date . ' 00:00:00',
                    $request->to_date . ' 23:59:59'
                ]);
            }

            $logs = $query->paginate(50);

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/system-logs
    public function systemLogs(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $query = DB::table('system_logs')->orderBy('created_at', 'desc');

            // Filter by level if provided
            if ($request->has('level')) {
                $query->where('level', $request->level);
            }

            // Filter by date range if provided
            if ($request->has('from_date') && $request->has('to_date')) {
                $query->whereBetween('created_at', [
                    $request->from_date . ' 00:00:00',
                    $request->to_date . ' 23:59:59'
                ]);
            }

            $logs = $query->paginate(50);

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil system logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/audit-logs/{id}
    public function show($logId, Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $log = DB::table('audit_logs')->find($logId);

            if (!$log) {
                return response()->json([
                    'success' => false,
                    'message' => 'Log tidak ditemukan',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $log,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail log',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/audit-logs/user-activity
    public function userActivity(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $summary = DB::table('audit_logs')
                ->select('user_id', DB::raw('COUNT(*) as total_actions'), DB::raw('MAX(created_at) as last_action'))
                ->groupBy('user_id')
                ->orderBy('last_action', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil user activity summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/admin/audit-logs/old
    public function clearOldLogs(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        $validated = $request->validate([
            'days' => 'required|integer|min:7|max:365', // Keep logs from last N days
        ]);

        try {
            $cutoffDate = now()->subDays($validated['days']);

            $deletedCount = DB::table('audit_logs')
                ->where('created_at', '<', $cutoffDate)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => "Berhasil menghapus {$deletedCount} log lama",
                'deleted_count' => $deletedCount,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membersihkan log lama',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/audit-logs/export
    public function export(Request $request)
    {
        // Verify superadmin role
        if (!$request->user()?->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized - Superadmin role required',
            ], 403);
        }

        try {
            $query = DB::table('audit_logs')->orderBy('created_at', 'desc');

            // Apply filters if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            if ($request->has('from_date') && $request->has('to_date')) {
                $query->whereBetween('created_at', [
                    $request->from_date . ' 00:00:00',
                    $request->to_date . ' 23:59:59'
                ]);
            }

            $logs = $query->get();

            // Generate CSV
            $headers = [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename=audit-logs-' . now()->format('Y-m-d') . '.csv',
            ];

            $callback = function () use ($logs) {
                $file = fopen('php://output', 'w');
                fputcsv($file, ['ID', 'User ID', 'Action', 'Description', 'IP Address', 'User Agent', 'Created At']);

                foreach ($logs as $log) {
                    fputcsv($file, [
                        $log->id,
                        $log->user_id,
                        $log->action,
                        $log->description,
                        $log->ip_address,
                        $log->user_agent,
                        $log->created_at,
                    ]);
                }
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal export audit logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
