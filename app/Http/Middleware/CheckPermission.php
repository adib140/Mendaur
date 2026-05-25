<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    // Middleware: check user permissions
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        // Get authenticated user
        $user = auth()->user();

        // If user not authenticated, return 401
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Check if user has all required permissions
        // If multiple permissions provided, user must have ALL of them
        foreach ($permissions as $permission) {
            if (!$user->hasPermission($permission)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized: You do not have permission for this action',
                    'required_permission' => $permission,
                ], 403);
            }
        }

        return $next($request);
    }
}
