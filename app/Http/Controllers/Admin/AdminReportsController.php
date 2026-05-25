<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TabungSampah;
use App\Models\PoinTransaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AdminReportsController extends Controller
{
    // GET /api/admin/reports/list
    public function list()
    {
        try {
            $reports = [
                [
                    'id' => 'waste-monthly',
                    'name' => 'Monthly Waste Report',
                    'type' => 'waste',
                    'frequency' => 'monthly',
                    'lastGenerated' => null,
                ],
                [
                    'id' => 'users-monthly',
                    'name' => 'Monthly Users Report',
                    'type' => 'users',
                    'frequency' => 'monthly',
                    'lastGenerated' => null,
                ],
                [
                    'id' => 'points-monthly',
                    'name' => 'Monthly Points Report',
                    'type' => 'points',
                    'frequency' => 'monthly',
                    'lastGenerated' => null,
                ],
                [
                    'id' => 'comprehensive',
                    'name' => 'Comprehensive Report',
                    'type' => 'comprehensive',
                    'frequency' => 'custom',
                    'lastGenerated' => null,
                ],
            ];

            return response()->json([
                'status' => 'success',
                'data' => [
                    'reports' => $reports,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch reports list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/admin/reports/generate
    public function generate(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:waste,users,points,comprehensive',
                'period' => 'required|in:monthly,quarterly,yearly',
                'startDate' => 'nullable|date_format:Y-m-d',
                'endDate' => 'nullable|date_format:Y-m-d',
                'format' => 'required|in:pdf,csv,xlsx'
            ]);

            $type = $request->type;
            $period = $request->period;
            $format = $request->format;

            // Determine date range
            $startDate = $request->startDate ? Carbon::parse($request->startDate) : null;
            $endDate = $request->endDate ? Carbon::parse($request->endDate) : null;

            if (!$startDate) {
                $now = Carbon::now();
                if ($period === 'monthly') {
                    $startDate = $now->copy()->startOfMonth();
                    $endDate = $now->copy()->endOfMonth();
                } elseif ($period === 'quarterly') {
                    $startDate = $now->copy()->firstOfQuarter();
                    $endDate = $now->copy()->lastOfQuarter();
                } else {
                    $startDate = $now->copy()->startOfYear();
                    $endDate = $now->copy()->endOfYear();
                }
            }

            // Build report data based on type
            $reportData = $this->buildReportData($type, $startDate, $endDate);

            // Generate filename
            $fileName = "{$type}_{$period}_" . date('Y-m-d') . ".{$format}";

            // In production, you would actually generate the file
            // For now, return the report data URL simulation
            $downloadUrl = "/api/admin/reports/download/{$fileName}";

            return response()->json([
                'status' => 'success',
                'data' => [
                    'reportId' => uniqid('report_'),
                    'downloadUrl' => $downloadUrl,
                    'generatedAt' => Carbon::now()->toIso8601String(),
                    'fileName' => $fileName,
                    'preview' => $reportData,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to generate report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/export
    public function export(Request $request)
    {
        try {
            $request->validate([
                'type' => 'required|in:users,waste,points',
                'format' => 'required|in:csv,xlsx,pdf'
            ]);

            $type = $request->type;
            $format = $request->format;

            // Get data based on type
            $data = [];

            if ($type === 'users') {
                $data = DB::table('users')
                    ->select('id', 'login', 'kategori', 'created_at', 'updated_at')
                    ->get()
                    ->toArray();
            } elseif ($type === 'waste') {
                // Check if tabung_sampah exists
                $hasSampahTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                    [DB::connection()->getDatabaseName(), 'tabung_sampah']);

                if (!empty($hasSampahTable)) {
                    $data = DB::table('tabung_sampah')
                        ->select('id', 'user_id', 'jenis_sampah', 'berat_kg', 'created_at')
                        ->get()
                        ->toArray();
                }
            } elseif ($type === 'points') {
                // Check if poin_transaksis exists
                $hasPoinTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                    [DB::connection()->getDatabaseName(), 'poin_transaksis']);

                if (!empty($hasPoinTable)) {
                    $data = DB::table('poin_transaksis')
                        ->select('id', 'user_id', 'jenis_poin', 'poin_didapat', 'created_at')
                        ->get()
                        ->toArray();
                }
            }

            // Generate filename
            $fileName = "{$type}_export_" . date('Y-m-d-His') . ".{$format}";

            // In production, generate actual file
            // For now, return simulation
            return response()->json([
                'status' => 'success',
                'data' => [
                    'fileName' => $fileName,
                    'downloadUrl' => "/api/admin/export/download/{$fileName}",
                    'recordCount' => count($data),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to export data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Build report data by type
    private function buildReportData($type, $startDate, $endDate)
    {
        if ($type === 'waste') {
            $hasSampahTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'tabung_sampah']);

            $totalWaste = 0;
            $submissions = 0;
            $byCategory = [];

            if (!empty($hasSampahTable)) {
                $totalWaste = DB::table('tabung_sampah')->whereBetween('created_at', [$startDate, $endDate])->sum('berat_kg') ?? 0;
                $submissions = DB::table('tabung_sampah')->whereBetween('created_at', [$startDate, $endDate])->count();
                $byCategory = DB::table('tabung_sampah')->whereBetween('created_at', [$startDate, $endDate])
                    ->select('jenis_sampah', DB::raw('SUM(berat_kg) as total'))
                    ->groupBy('jenis_sampah')
                    ->get()
                    ->toArray();
            }

            return [
                'totalWaste' => $totalWaste,
                'submissions' => $submissions,
                'byCategory' => $byCategory,
            ];
        } elseif ($type === 'users') {
            $totalUsers = DB::table('users')->count();
            $newUsers = DB::table('users')->whereBetween('created_at', [$startDate, $endDate])->count();

            return [
                'totalUsers' => $totalUsers,
                'newUsers' => $newUsers,
                'activeUsers' => $totalUsers,
            ];
        } elseif ($type === 'points') {
            $hasPoinTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'poin_transaksis']);

            $totalPoints = 0;
            $transactions = 0;
            $bySource = [];

            if (!empty($hasPoinTable)) {
                $totalPoints = DB::table('poin_transaksis')->whereBetween('created_at', [$startDate, $endDate])->sum('poin_didapat') ?? 0;
                $transactions = DB::table('poin_transaksis')->whereBetween('created_at', [$startDate, $endDate])->count();
                $bySource = DB::table('poin_transaksis')->whereBetween('created_at', [$startDate, $endDate])
                    ->select('jenis_poin', DB::raw('SUM(poin_didapat) as total'))
                    ->groupBy('jenis_poin')
                    ->get()
                    ->toArray();
            }

            return [
                'totalPoints' => $totalPoints,
                'transactions' => $transactions,
                'bySource' => $bySource,
            ];
        } else {
            // Comprehensive report
            $hasSampahTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'tabung_sampah']);
            $hasPoinTable = DB::select("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
                [DB::connection()->getDatabaseName(), 'poin_transaksis']);

            $totalWaste = 0;
            $totalPoints = 0;

            if (!empty($hasSampahTable)) {
                $totalWaste = DB::table('tabung_sampah')->whereBetween('created_at', [$startDate, $endDate])->sum('berat_kg') ?? 0;
            }

            if (!empty($hasPoinTable)) {
                $totalPoints = DB::table('poin_transaksis')->whereBetween('created_at', [$startDate, $endDate])->sum('poin_didapat') ?? 0;
            }

            return [
                'waste' => [
                    'total' => $totalWaste,
                ],
                'users' => [
                    'total' => DB::table('users')->count(),
                    'new' => DB::table('users')->whereBetween('created_at', [$startDate, $endDate])->count(),
                ],
                'points' => [
                    'total' => $totalPoints,
                ],
            ];
        }
    }
}
