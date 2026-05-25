<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class AdminMiddleware
{
    // Middleware: check admin/superadmin access
    public function handle(Request $request, Closure $next): Response
    {
        // Get the authenticated user
        $user = $request->user();

        // Debug logging
        Log::info('AdminMiddleware Check', [
            'user_exists' => $user ? 'yes' : 'no',
            'user_id' => $user?->user_id,
            'user_level' => $user?->level,
            'request_path' => $request->path(),
        ]);

        // Check if user exists
        if (!$user) {
            Log::warning('AdminMiddleware: No authenticated user');
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.',
            ], 401);
        }

        // Check if user has admin or superadmin role (case-insensitive)
        $userLevel = strtolower($user->level);
        $allowedLevels = ['admin', 'superadmin'];

        if (!in_array($userLevel, $allowedLevels)) {
            Log::warning('AdminMiddleware: User level not allowed', [
                'user_id' => $user->user_id,
                'user_level' => $user->level,
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki akses ke fitur ini. Hanya admin/superadmin yang diizinkan.',
            ], 403);
        }

        return $next($request);
    }
}
