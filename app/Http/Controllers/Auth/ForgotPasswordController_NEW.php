<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\OtpService;
use App\Jobs\SendOtpEmailJob;
use App\Http\Requests\Auth\SendOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Support\Facades\Hash;

/**
 * Forgot Password Controller (REFACTORED - Clean Architecture)
 *
 * Changes from old version (284 lines → ~150 lines):
 * - Validation moved to Form Requests
 * - Business logic moved to OtpService
 * - Email sending moved to Queue Job
 * - Rate limiting moved to Middleware
 * - Backward compatible hashed OTP verification
 */
class ForgotPasswordController extends Controller
{
    /**
     * OTP Service instance
     */
    protected OtpService $otpService;

    /**
     * Constructor - Dependency Injection
     */
    public function __construct(OtpService $otpService)
    {
        $this->otpService = $otpService;
    }

    /**
     * Send OTP to user's email
     * POST /api/forgot-password
     *
     * @param SendOtpRequest $request (auto-validated)
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendOTP(SendOtpRequest $request)
    {
        try {
            $email = $request->validated()['email'];

            // Validate user exists and is active (via service)
            $userValidation = $this->otpService->validateUser($email);
            if (!$userValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $userValidation['message']
                ], $userValidation['user'] ? 403 : 404);
            }

            $user = $userValidation['user'];

            // Generate OTP (via service)
            $otpData = $this->otpService->generateOtp($email);

            // Dispatch email job to queue (async, non-blocking)
            SendOtpEmailJob::dispatch(
                $user,
                $otpData['otp'],
                $otpData['expires_at']
            );

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP telah dikirim ke email Anda',
                'data' => [
                    'email' => $email,
                    'expires_in' => OtpService::OTP_EXPIRY_MINUTES * 60, // seconds
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to send OTP', [
                'email' => $request->email ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim OTP. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Verify OTP code
     * POST /api/verify-otp
     *
     * @param VerifyOtpRequest $request (auto-validated)
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyOTP(VerifyOtpRequest $request)
    {
        try {
            $validated = $request->validated();
            $email = $validated['email'];
            $otp = $validated['otp'];

            // Verify OTP (via service - uses hashed verification with plaintext fallback)
            $verification = $this->otpService->verifyOtp($email, $otp);

            if (!$verification['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $verification['message']
                ], 400);
            }

            // Mark OTP as verified and generate reset token (via service)
            $resetTokenData = $this->otpService->markOtpVerified($verification['record']);

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP berhasil diverifikasi',
                'data' => [
                    'email' => $email,
                    'reset_token' => $resetTokenData['reset_token'],
                    'expires_in' => OtpService::RESET_TOKEN_EXPIRY_MINUTES * 60, // seconds
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to verify OTP', [
                'email' => $request->email ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memverifikasi OTP. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Reset password with verified OTP
     * POST /api/reset-password
     *
     * @param ResetPasswordRequest $request (auto-validated)
     * @return \Illuminate\Http\JsonResponse
     */
    public function resetPassword(ResetPasswordRequest $request)
    {
        try {
            $validated = $request->validated();
            $email = $validated['email'];
            $resetToken = $validated['reset_token'];
            $password = $validated['password'];

            // Verify reset token (via service)
            $tokenVerification = $this->otpService->verifyResetToken($email, $resetToken);

            if (!$tokenVerification['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $tokenVerification['message']
                ], 400);
            }

            // Update user password
            $user = User::where('email', $email)->first();
            $user->update([
                'password' => Hash::make($password)
            ]);

            // Clean up OTP record (via service)
            $this->otpService->cleanupOtpByEmail($email);

            // Log successful password reset
            \Log::info('Password reset successful', [
                'email' => $email,
                'user_id' => $user->user_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan login dengan password baru.',
                'data' => [
                    'email' => $email
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Failed to reset password', [
                'email' => $request->email ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal mereset password. Silakan coba lagi.',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Resend OTP (optional endpoint)
     * POST /api/resend-otp
     *
     * @param SendOtpRequest $request (auto-validated, rate limited by middleware)
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendOTP(SendOtpRequest $request)
    {
        // Reuse sendOTP logic (rate limiting handled by middleware)
        return $this->sendOTP($request);
    }
}
