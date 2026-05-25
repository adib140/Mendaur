<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware untuk menangani request dari Safari/iOS
 *
 * Safari/iOS memiliki kebijakan ketat untuk:
 * - Third-party cookies
 * - Cross-site tracking prevention
 * - CORS dengan credentials
 */
class HandleSafariIOS
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userAgent = $request->header('User-Agent', '');

        // Detect Safari/iOS
        $isSafari = $this->isSafari($userAgent);
        $isIOS = $this->isIOS($userAgent);

        // Log Safari/iOS requests for debugging (dalam development)
        if (($isSafari || $isIOS) && config('app.debug')) {
            Log::info('Safari/iOS Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'is_safari' => $isSafari,
                'is_ios' => $isIOS,
                'origin' => $request->header('Origin'),
                'referer' => $request->header('Referer'),
            ]);
        }

        // Process request
        $response = $next($request);

        // Add headers for better Safari/iOS compatibility
        if ($isSafari || $isIOS) {
            // Disable caching for API responses on Safari
            if ($request->is('api/*')) {
                $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate, private');
                $response->headers->set('Pragma', 'no-cache');
                $response->headers->set('Expires', '0');
            }

            // Add debug header (remove in production)
            if (config('app.debug')) {
                $response->headers->set('X-Safari-iOS-Handled', 'true');
            }
        }

        return $response;
    }

    /**
     * Check if request is from Safari browser
     */
    private function isSafari(string $userAgent): bool
    {
        // Safari contains "Safari" but NOT "Chrome" or "Chromium"
        // Chrome also contains "Safari" in user agent, so we need to exclude it
        return str_contains($userAgent, 'Safari')
            && !str_contains($userAgent, 'Chrome')
            && !str_contains($userAgent, 'Chromium')
            && !str_contains($userAgent, 'Edg');
    }

    /**
     * Check if request is from iOS device
     */
    private function isIOS(string $userAgent): bool
    {
        return str_contains($userAgent, 'iPhone')
            || str_contains($userAgent, 'iPad')
            || str_contains($userAgent, 'iPod');
    }
}
