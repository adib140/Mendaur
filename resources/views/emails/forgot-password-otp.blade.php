<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Reset Password</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #22c55e;
            margin-bottom: 10px;
        }
        .otp-code {
            background: #f8f9fa;
            border: 2px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-number {
            font-size: 32px;
            font-weight: bold;
            color: #22c55e;
            letter-spacing: 5px;
            margin: 10px 0;
        }
        .warning {
            background: #fef3cd;
            border: 1px solid #fecb03;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌱 Mendaur</div>
            <h2>Reset Password</h2>
        </div>

        <p>Halo <strong>{{ $userName }}</strong>,</p>

        <p>Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode OTP di bawah ini untuk melanjutkan proses reset password:</p>

        <div class="otp-code">
            <p style="margin: 0; color: #666;">Kode OTP Anda:</p>
            <div class="otp-number">{{ $otp }}</div>
            <p style="margin: 0; color: #666; font-size: 14px;">Berlaku sampai {{ $expiresAt->format('H:i, d M Y') }}</p>
        </div>

        <div class="warning">
            <strong>⚠️ Penting:</strong>
            <ul style="margin: 10px 0;">
                <li>Jangan bagikan kode OTP ini kepada siapapun</li>
                <li>Kode akan kedaluwarsa dalam 10 menit</li>
                <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
            </ul>
        </div>

        <p>Masukkan kode OTP di atas pada halaman reset password untuk melanjutkan.</p>

        <p>Jika Anda mengalami kesulitan, silakan hubungi tim support kami.</p>

        <p>Salam,<br>
        <strong>Tim Mendaur</strong></p>

        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon jangan balas email ini.</p>
            <p>&copy; {{ date('Y') }} Mendaur. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
