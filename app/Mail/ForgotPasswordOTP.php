<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;
use Carbon\Carbon;

class ForgotPasswordOTP extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $otp;
    public $expiresAt;

    public function __construct(User $user, string $otp, Carbon $expiresAt)
    {
        $this->user = $user;
        $this->otp = $otp;
        $this->expiresAt = $expiresAt;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your Password - Mendaur Bank Sampah',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.forgot-password-otp',
            with: [
                'userName' => $this->user->nama,
                'otp' => $this->otp,
                'expiresAt' => $this->expiresAt,
            ]
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
