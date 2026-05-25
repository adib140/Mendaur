<?php

namespace App\Services;

use App\Models\User;
use App\Models\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class OtpService
{
    const OTP_LENGTH = 6;
    const OTP_EXPIRY_MINUTES = 10;
    const RESET_TOKEN_EXPIRY_MINUTES = 30;
    const MAX_OTP_ATTEMPTS = 3;
    const RATE_LIMIT_WINDOW_MINUTES = 5;

    public function generateOtp(string $email): array
    {
        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), self::OTP_LENGTH, '0', STR_PAD_LEFT);

        // Calculate expiry time
        $expiresAt = Carbon::now()->addMinutes(self::OTP_EXPIRY_MINUTES);

        // Delete any existing OTP for this email (prevent multiple active OTPs)
        $this->cleanupOtpByEmail($email);

        // Prepare data for OTP record
        // Only include otp_hash if the column exists (backward compatibility)
        $otpData = [
            'email' => $email,
            'otp' => $otp,  // Plaintext for backward compatibility
            'token' => Hash::make($otp),  // Legacy field
            'expires_at' => $expiresAt,
            'created_at' => Carbon::now(),
        ];

        // Check if otp_hash column exists and add it
        if (\Schema::hasColumn('password_resets', 'otp_hash')) {
            $otpData['otp_hash'] = Hash::make($otp);
        }

        // Create new OTP record
        $record = PasswordReset::create($otpData);

        return [
            'otp' => $otp,  // Return plaintext for email sending ONLY
            'expires_at' => $expiresAt,
            'record' => $record,
        ];
    }

    public function verifyOtp(string $email, string $otp): array
    {
        // Find non-expired OTP record
        $record = PasswordReset::where('email', $email)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return [
                'valid' => false,
                'record' => null,
                'message' => 'Kode OTP tidak valid atau sudah kedaluwarsa',
            ];
        }

        // Security: Use hashed verification first (NEW method)
        $isValidHashed = !empty($record->otp_hash) && Hash::check($otp, $record->otp_hash);

        // Fallback: Plaintext comparison (OLD method, for backward compatibility)
        $isValidPlaintext = !empty($record->otp) && $record->otp === $otp;

        if (!$isValidHashed && !$isValidPlaintext) {
            return [
                'valid' => false,
                'record' => $record,
                'message' => 'Kode OTP tidak valid',
            ];
        }

        // OTP is valid
        return [
            'valid' => true,
            'record' => $record,
            'message' => 'Kode OTP berhasil diverifikasi',
        ];
    }

    public function markOtpVerified(PasswordReset $record): array
    {
        // Generate secure reset token for password reset step
        $resetToken = \Illuminate\Support\Str::random(60);
        $expiresAt = Carbon::now()->addMinutes(self::RESET_TOKEN_EXPIRY_MINUTES);

        // Update record: mark as verified, store reset token, extend expiry
        $record->update([
            'verified_at' => Carbon::now(),
            'reset_token' => Hash::make($resetToken),
            'expires_at' => $expiresAt,  // Extend for password reset step
        ]);

        return [
            'reset_token' => $resetToken,  // Return plaintext token (one-time use)
            'expires_at' => $expiresAt,
        ];
    }

    public function verifyResetToken(string $email, string $resetToken): array
    {
        // Find verified, non-expired reset record
        $record = PasswordReset::where('email', $email)
            ->whereNotNull('verified_at')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$record) {
            return [
                'valid' => false,
                'record' => null,
                'message' => 'Token reset tidak valid atau sudah kedaluwarsa',
            ];
        }

        // Verify reset token hash
        if (!Hash::check($resetToken, $record->reset_token)) {
            return [
                'valid' => false,
                'record' => $record,
                'message' => 'Token reset tidak valid',
            ];
        }

        return [
            'valid' => true,
            'record' => $record,
            'message' => 'Token reset valid',
        ];
    }

    public function cleanupOtpByEmail(string $email): int
    {
        return PasswordReset::where('email', $email)->delete();
    }

    public function cleanupExpiredOtps(): int
    {
        return PasswordReset::where('expires_at', '<', Carbon::now())->delete();
    }

    public function checkRateLimit(string $email): array
    {
        $recentAttempts = PasswordReset::where('email', $email)
            ->where('created_at', '>', Carbon::now()->subMinutes(self::RATE_LIMIT_WINDOW_MINUTES))
            ->count();

        $allowed = $recentAttempts < self::MAX_OTP_ATTEMPTS;
        $waitSeconds = $allowed ? 0 : self::RATE_LIMIT_WINDOW_MINUTES * 60;

        return [
            'allowed' => $allowed,
            'attempts' => $recentAttempts,
            'wait_seconds' => $waitSeconds,
        ];
    }

    public function validateUser(string $email): array
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            return [
                'valid' => false,
                'user' => null,
                'message' => 'Email tidak ditemukan',
            ];
        }

        if ($user->status !== 'active') {
            return [
                'valid' => false,
                'user' => $user,
                'message' => 'Akun tidak aktif. Silakan hubungi administrator.',
            ];
        }

        return [
            'valid' => true,
            'user' => $user,
            'message' => 'User valid',
        ];
    }
}
