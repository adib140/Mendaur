<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    // Get redirect path for unauthenticated users
    protected function redirectTo(Request $request): ?string
    {
        // For API requests, return null to trigger a JSON response instead of redirect
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // For web routes (if any), redirect to login
        return route('login');
    }

    // Handle unauthenticated API requests
    protected function unauthenticated($request, array $guards)
    {
        // Return JSON response for API requests
        if ($request->expectsJson() || $request->is('api/*')) {
            abort(response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login first.',
                'error' => 'Authentication required'
            ], 401));
        }

        // For web routes, use default behavior
        parent::unauthenticated($request, $guards);
    }
}
