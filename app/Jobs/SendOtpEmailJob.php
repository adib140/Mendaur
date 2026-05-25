<?php

namespace App\Jobs;

use App\Models\User;
use App\Mail\ForgotPasswordOTP;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

// SendOtpEmailJob - Sends OTP email directly (no queue)
class SendOtpEmailJob
{
    use Dispatchable;

    protected User $user;
    protected string $otp;
    protected Carbon $expiresAt;

    public function __construct(User $user, string $otp, Carbon $expiresAt)
    {
        $this->user = $user;
        $this->otp = $otp;
        $this->expiresAt = $expiresAt;
    }

    // Execute the job - send email directly
    public function handle(): void
    {
        try {
            // Set shorter timeout for SMTP
            config(['mail.mailers.smtp.timeout' => 30]);

            Mail::to($this->user->email)->send(
                new ForgotPasswordOTP($this->user, $this->otp, $this->expiresAt)
            );

            Log::info('OTP email sent successfully', [
                'email' => $this->user->email,
                'expires_at' => $this->expiresAt->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send OTP email', [
                'email' => $this->user->email,
                'error' => $e->getMessage(),
            ]);
            // Don't re-throw - let the request complete even if email fails
        }
    }
}
