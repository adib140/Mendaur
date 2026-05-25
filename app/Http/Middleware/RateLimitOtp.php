<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\OtpService;

class RateLimitOtp
{
    protected OtpService $otpService;

    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    // Middleware: rate limit OTP requests
    public function handle(Request $request, Closure $next): Response
    {
        $email = $request->input('email');

        if (!$email) {
            return $next($request);
        }

        // Check rate limit via service
        $rateLimit = $this->otpService->checkRateLimit($email);

        if (!$rateLimit['allowed']) {
            return response()->json([
                'success' => false,
                'message' => 'Terlalu banyak permintaan OTP. Silakan tunggu beberapa menit.',
                'data' => [
                    'retry_after_seconds' => $rateLimit['wait_seconds'],
                    'retry_after_minutes' => ceil($rateLimit['wait_seconds'] / 60),
                ]
            ], 429);
        }

        return $next($request);
    }
}
