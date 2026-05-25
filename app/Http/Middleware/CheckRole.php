<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    // Middleware: check user role
    public function handle(Request $request, Closure $next, ...$roles): Response
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

        // Check if user has one of the required roles
        if (!$user->hasAnyRole(...$roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: You do not have access to this resource',
                'required_roles' => $roles,
            ], 403);
        }

        return $next($request);
    }
}
