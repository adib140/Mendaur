<?php

namespace App\Services;

use App\Models\User;
use App\Models\LogAktivitas;
use App\Models\PoinTransaksi;
use App\Services\PointService;

// Service untuk mengontrol akses fitur berdasarkan tipe nasabah
class DualNasabahFeatureAccessService
{
    // Check if user can access penarikan tunai (withdrawal) feature
    public function canAccessWithdrawal(User $user): array
    {
        $result = [
            'allowed' => false,
            'reason' => '',
            'code' => 'UNAUTHORIZED',
        ];

        // Check if user is modern nasabah
        if ($user->isNasabahModern()) {
            $result['reason'] = 'Modern nasabah tidak dapat menggunakan fitur penarikan tunai';
            $result['code'] = 'MODERN_NASABAH_BLOCKED';
            return $result;
        }

        // Check if user has permission
        if (!$user->hasPermission('request_withdrawal')) {
            $result['reason'] = 'Anda tidak memiliki izin untuk fitur ini';
            $result['code'] = 'NO_PERMISSION';
            return $result;
        }

        // FIXED: Check using actual available poin from transactions, not actual_poin field
        $availablePoin = $user->getUsablePoin();
        if ($availablePoin <= 0) {
            $result['reason'] = 'Saldo poin Anda tidak cukup';
            $result['code'] = 'INSUFFICIENT_POIN';
            return $result;
        }

        // Check if user has banking info
        if (empty($user->nama_bank) || empty($user->nomor_rekening)) {
            $result['reason'] = 'Data rekening bank belum lengkap';
            $result['code'] = 'INCOMPLETE_BANKING_INFO';
            return $result;
        }

        $result['allowed'] = true;
        $result['code'] = 'OK';
        return $result;
    }

    // Check if user can access penukaran produk (product redemption) feature
    public function canAccessRedemption(User $user, int $poinRequired = 0): array
    {
        $result = [
            'allowed' => false,
            'reason' => '',
            'code' => 'UNAUTHORIZED',
        ];

        // Check if user is modern nasabah
        if ($user->isNasabahModern()) {
            $result['reason'] = 'Modern nasabah tidak dapat menukar poin dengan produk';
            $result['code'] = 'MODERN_NASABAH_BLOCKED';
            return $result;
        }

        // Check if user has permission
        if (!$user->hasPermission('redeem_poin')) {
            $result['reason'] = 'Anda tidak memiliki izin untuk fitur ini';
            $result['code'] = 'NO_PERMISSION';
            return $result;
        }

        // FIXED: Check using actual available poin from transactions, not actual_poin field
        $availablePoin = $user->getUsablePoin();
        if ($availablePoin < $poinRequired) {
            $result['reason'] = "Poin Anda tidak cukup (diperlukan: {$poinRequired}, poin Anda: {$availablePoin})";
            $result['code'] = 'INSUFFICIENT_POIN';
            return $result;
        }

        $result['allowed'] = true;
        $result['code'] = 'OK';
        return $result;
    }

    // Check if user can deposit sampah
    public function canAccessDeposit(User $user): array
    {
        $result = [
            'allowed' => false,
            'reason' => '',
            'code' => 'UNAUTHORIZED',
        ];

        // Check if user has permission
        if (!$user->hasPermission('deposit_sampah')) {
            $result['reason'] = 'Anda tidak memiliki izin untuk fitur ini';
            $result['code'] = 'NO_PERMISSION';
            return $result;
        }

        $result['allowed'] = true;
        $result['code'] = 'OK';
        return $result;
    }

    // Add poin untuk nasabah setelah deposit sampah
    public function addPoinForDeposit(
        User $user,
        int $poin,
        int $tabungSampahId,
        string $jenisSampah = '',
        string $sumber = 'tabung_sampah'
    ): void {
        if ($user->isNasabahKonvensional()) {
            // Konvensional: gunakan earnPoints() standar (tambah kedua field)
            PointService::earnPoints(
                $user,
                $poin,
                'deposit_sampah_' . $sumber,
                "Poin dari penyetoran sampah ({$jenisSampah})",
                $tabungSampahId,
                'TabungSampah'
            );
        } else {
            // Modern: hanya tambah display_poin untuk leaderboard
            // actual_poin tidak ditambah karena poin tidak bisa digunakan
            $user->increment('display_poin', $poin);
            $user->save();

            // Create poin transaction log (marked as not usable)
            PoinTransaksi::create([
                'user_id' => $user->user_id,
                'tabung_sampah_id' => $tabungSampahId,
                'jenis_sampah' => $jenisSampah,
                'berat_kg' => 0,
                'poin_didapat' => $poin,
                'sumber' => $sumber,
                'keterangan' => 'Poin dari penyetoran sampah (modern nasabah - display only)',
                'referensi_tipe' => 'TabungSampah',
                'referensi_id' => $tabungSampahId,
                'is_usable' => false,
                'reason_not_usable' => 'modern_nasabah_type',
            ]);
        }
    }

    // Deduct poin untuk penukaran produk (redemption)
    public function deductPoinForRedemption(
        User $user,
        int $poin,
        int $penukaranProdukId,
        string $reason = ''
    ): void {
        // Only konvensional nasabah can reach here due to access control
        if (!$user->isNasabahKonvensional()) {
            throw new \Exception('Modern nasabah cannot redeem poin');
        }

        // Use PointService for consistent poin handling
        PointService::deductPointsForRedemption(
            $user,
            $poin,
            $penukaranProdukId,
            "Penukaran produk: {$reason}"
        );
    }

    // Deduct poin untuk penarikan tunai (withdrawal)
    public function deductPoinForWithdrawal(
        User $user,
        int $poin,
        int $penarikanTunaiId,
        string $reason = ''
    ): void {
        // Only konvensional nasabah can reach here
        if (!$user->isNasabahKonvensional()) {
            throw new \Exception('Modern nasabah cannot withdraw poin');
        }

        // Use PointService for consistent poin handling
        PointService::deductPointsForWithdrawal(
            $user,
            $poin,
            $penarikanTunaiId,
            "Penarikan tunai: {$reason}"
        );
    }

    // Get poin display info for user
    public function getPoinDisplay(User $user): array
    {
        return [
            'tipe_nasabah' => $user->tipe_nasabah,
            'poin_tercatat' => $user->display_poin, // Backward compatibility, use display_poin
            'poin_usable' => $user->isNasabahKonvensional() ? $user->actual_poin : 0,
            'actual_poin' => $user->actual_poin,
            'display_poin' => $user->display_poin,
            'message' => $user->isNasabahModern()
                ? 'Poin Anda tercatat untuk badge dan leaderboard, tetapi tidak dapat digunakan untuk penarikan atau penukaran produk'
                : 'Poin Anda dapat digunakan untuk penarikan tunai dan penukaran produk'
        ];
    }

    // Log aktivitas untuk dual-nasabah tracking
    public function logActivity(
        User $user,
        string $tipeAktivitas,
        string $deskripsi,
        int $poinChange = 0,
        string $sourceTipe = ''
    ): void {
        LogAktivitas::create([
            'user_id' => $user->user_id,
            'tipe_aktivitas' => $tipeAktivitas,
            'deskripsi' => $deskripsi,
            'poin_perubahan' => $poinChange,
            'poin_tercatat' => $user->display_poin, // Use display_poin instead
            'poin_usable' => $user->isNasabahKonvensional() ? $user->actual_poin : 0,
            'source_tipe' => $sourceTipe,
            'tanggal' => now(),
        ]);
    }

    // Summary data untuk dashboard nasabah
    public function getNasabahSummary(User $user): array
    {
        $badges = $user->userBadges()->with('badge')->get();

        return [
            'user_id' => $user->user_id,
            'nama' => $user->nama,
            'tipe_nasabah' => $user->tipe_nasabah,
            'poin_tercatat' => $user->display_poin, // Use display_poin for backward compatibility
            'poin_usable' => $user->isNasabahKonvensional() ? $user->actual_poin : 0,
            'actual_poin' => $user->actual_poin,
            'display_poin' => $user->display_poin,
            'badges_count' => $badges->count(),
            'deposits_count' => $user->tabungSampahs()->count(),
            'feature_access' => [
                'can_withdraw' => $this->canAccessWithdrawal($user)['allowed'],
                'can_redeem' => $this->canAccessRedemption($user)['allowed'],
                'can_deposit' => $this->canAccessDeposit($user)['allowed'],
            ],
            'message_type' => $user->isNasabahModern() ? 'modern' : 'konvensional',
        ];
    }
}
