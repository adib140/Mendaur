<?php

namespace App\Services;

use App\Models\PoinTransaksi;
use App\Models\TabungSampah;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PointService - Centralized Point Management
 *
 * SKEMA POIN:
 * - display_poin: Untuk leaderboard/ranking (bisa di-reset periodik)
 * - actual_poin: Untuk transaksi (withdrawal, redeem) - saldo aktual
 *
 * ATURAN:
 * 1. MENAMBAH POIN (setor sampah, bonus, badge reward):
 *    - Tambah display_poin (untuk leaderboard)
 *    - Tambah actual_poin (untuk saldo)
 *    - Catat di poin_transaksis dengan poin_didapat POSITIF
 *
 * 2. MENGURANGI POIN (redeem produk, withdrawal):
 *    - TIDAK kurangi display_poin (leaderboard tetap)
 *    - Kurangi actual_poin (saldo berkurang)
 *    - Catat di poin_transaksis dengan poin_didapat NEGATIF
 *
 * 3. REFUND POIN (cancel redeem, reject withdrawal):
 *    - TIDAK tambah display_poin (karena sebelumnya tidak dikurangi)
 *    - Tambah actual_poin (saldo kembali)
 *    - Catat di poin_transaksis dengan poin_didapat POSITIF (refund)
 */
class PointService
{
    // Sumber Transaksi Poin
    const SUMBER_SETOR_SAMPAH = 'setor_sampah';
    const SUMBER_BONUS = 'bonus';
    const SUMBER_BADGE_REWARD = 'badge_reward';
    const SUMBER_EVENT = 'event';
    const SUMBER_MANUAL = 'manual';
    const SUMBER_PENUKARAN_PRODUK = 'penukaran_produk';
    const SUMBER_REFUND_PENUKARAN = 'refund_penukaran';
    const SUMBER_PENARIKAN_TUNAI = 'penarikan_tunai';
    const SUMBER_PENGEMBALIAN_PENARIKAN = 'pengembalian_penarikan';

    /**
     * Point values per kg for each waste type
     */
    const POINT_VALUES = [
        'Kertas' => 5,
        'Plastik' => 10,
        'Logam' => 15,
        'Kaca' => 8,
        'Organik' => 3,
        'Tekstil' => 8,
        'Elektronik' => 20,
        'Lainnya' => 5,
    ];

    /**
     * Bonus configuration
     */
    const BONUS_CONFIG = [
        'first_deposit' => 50,
        'fifth_deposit' => 25,
        'tenth_deposit' => 40,
        'large_deposit_10kg' => 30,
        'large_deposit_20kg' => 50,
    ];

    protected static function recordPointTransaction(
        $userId,
        $points,
        $sumber = 'setor_sampah',
        $keterangan = '',
        $tabungSampah = null,
        $referensiId = null,
        $referensiTipe = null,
        bool $updateDisplayPoin = false
    ): PoinTransaksi {
        return DB::transaction(function() use (
            $userId, $points, $sumber, $keterangan,
            $tabungSampah, $referensiId, $referensiTipe, $updateDisplayPoin
        ) {
            try {
                $transaction = PoinTransaksi::create([
                    'user_id' => $userId,
                    'tabung_sampah_id' => $tabungSampah?->tabung_sampah_id ?? $tabungSampah?->id,
                    'jenis_sampah' => $tabungSampah?->jenis_sampah,
                    'berat_kg' => $tabungSampah?->berat_kg,
                    'poin_didapat' => $points,
                    'sumber' => $sumber,
                    'keterangan' => $keterangan,
                    'referensi_id' => $referensiId,
                    'referensi_tipe' => $referensiTipe,
                ]);

                $user = User::findOrFail($userId);
                $oldActualPoin = $user->actual_poin;
                $oldDisplayPoin = $user->display_poin;

                $user->increment('actual_poin', $points);

                if ($updateDisplayPoin && $points > 0) {
                    $user->increment('display_poin', $points);
                }

                Log::info('Point transaction recorded', [
                    'user_id' => $userId,
                    'points' => $points,
                    'sumber' => $sumber,
                    'update_display_poin' => $updateDisplayPoin,
                    'old_actual_poin' => $oldActualPoin,
                    'new_actual_poin' => $user->fresh()->actual_poin,
                    'old_display_poin' => $oldDisplayPoin,
                    'new_display_poin' => $user->fresh()->display_poin,
                    'transaction_id' => $transaction->poin_transaksi_id ?? $transaction->id,
                ]);

                return $transaction;
            } catch (\Exception $e) {
                Log::error('Failed to record point transaction', [
                    'user_id' => $userId,
                    'points' => $points,
                    'sumber' => $sumber,
                    'error' => $e->getMessage(),
                ]);
                throw $e;
            }
        });
    }

    public static function earnPoints(
        int $userId,
        int $points,
        string $sumber,
        string $keterangan = '',
        ?TabungSampah $tabungSampah = null,
        ?int $referensiId = null,
        ?string $referensiTipe = null
    ): PoinTransaksi {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Points to earn must be positive');
        }

        return self::recordPointTransaction(
            $userId,
            $points,
            $sumber,
            $keterangan,
            $tabungSampah,
            $referensiId,
            $referensiTipe,
            true
        );
    }

    public static function spendPoints(
        int $userId,
        int $points,
        string $sumber,
        string $keterangan = '',
        ?int $referensiId = null,
        ?string $referensiTipe = null
    ): PoinTransaksi {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Points to spend must be positive');
        }

        $user = User::findOrFail($userId);
        if ($user->actual_poin < $points) {
            throw new \Exception("Poin tidak cukup. Saldo: {$user->actual_poin}, Dibutuhkan: {$points}");
        }

        return self::recordPointTransaction(
            $userId,
            -$points,
            $sumber,
            $keterangan,
            null,
            $referensiId,
            $referensiTipe,
            false
        );
    }

    public static function refundPoints(
        int $userId,
        int $points,
        string $sumber,
        string $keterangan = '',
        ?int $referensiId = null,
        ?string $referensiTipe = null
    ): PoinTransaksi {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Points to refund must be positive');
        }

        return self::recordPointTransaction(
            $userId,
            $points,
            $sumber,
            $keterangan,
            null,
            $referensiId,
            $referensiTipe,
            false
        );
    }

    public static function calculatePointsForDeposit(TabungSampah $tabungSampah): array
    {
        $jenis = $tabungSampah->jenis_sampah;
        $berat = $tabungSampah->berat_kg ?? 1;
        $userId = $tabungSampah->user_id;

        $basePerKg = self::POINT_VALUES[$jenis] ?? 5;
        $basePoin = (int)($basePerKg * $berat);

        $bonuses = [];
        $totalBonus = 0;

        $approvedDeposits = TabungSampah::where('user_id', $userId)
            ->where('status', 'approved')
            ->count();

        if ($approvedDeposits === 0) {
            $bonuses['first_deposit'] = self::BONUS_CONFIG['first_deposit'];
            $totalBonus += self::BONUS_CONFIG['first_deposit'];
        }

        if (($approvedDeposits + 1) % 5 === 0) {
            $bonuses['fifth_deposit'] = self::BONUS_CONFIG['fifth_deposit'];
            $totalBonus += self::BONUS_CONFIG['fifth_deposit'];
        }

        if (($approvedDeposits + 1) % 10 === 0) {
            $bonuses['tenth_deposit'] = self::BONUS_CONFIG['tenth_deposit'];
            $totalBonus += self::BONUS_CONFIG['tenth_deposit'];
        }

        if ($berat >= 20) {
            $bonuses['large_deposit_20kg'] = self::BONUS_CONFIG['large_deposit_20kg'];
            $totalBonus += self::BONUS_CONFIG['large_deposit_20kg'];
        } elseif ($berat >= 10) {
            $bonuses['large_deposit_10kg'] = self::BONUS_CONFIG['large_deposit_10kg'];
            $totalBonus += self::BONUS_CONFIG['large_deposit_10kg'];
        }

        return [
            'base' => $basePoin,
            'bonuses' => $bonuses,
            'total' => $basePoin + $totalBonus,
            'breakdown' => [
                'base_calculation' => "{$basePerKg} poin/kg × {$berat}kg = {$basePoin} poin",
                'bonus_details' => self::formatBonusDetails($bonuses),
            ],
        ];
    }

    private static function formatBonusDetails(array $bonuses): string
    {
        if (empty($bonuses)) {
            return 'Tidak ada bonus';
        }

        $details = [];
        $labels = [
            'first_deposit' => 'Bonus penyetoran pertama',
            'fifth_deposit' => 'Bonus setiap 5 penyetoran',
            'tenth_deposit' => 'Bonus setiap 10 penyetoran',
            'large_deposit_10kg' => 'Bonus penyetoran besar (10kg+)',
            'large_deposit_20kg' => 'Bonus penyetoran besar (20kg+)',
        ];

        foreach ($bonuses as $type => $points) {
            $label = $labels[$type] ?? $type;
            $details[] = "{$label}: +{$points}";
        }

        return implode(', ', $details);
    }

    public static function applyDepositPoints(TabungSampah $tabungSampah): PoinTransaksi
    {
        $calculation = self::calculatePointsForDeposit($tabungSampah);

        $keterangan = "Setor {$tabungSampah->berat_kg}kg {$tabungSampah->jenis_sampah}";
        if (!empty($calculation['bonuses'])) {
            $keterangan .= " + " . $calculation['breakdown']['bonus_details'];
        }

        return self::earnPoints(
            $tabungSampah->user_id,
            $calculation['total'],
            self::SUMBER_SETOR_SAMPAH,
            $keterangan,
            $tabungSampah,
            $tabungSampah->tabung_sampah_id ?? $tabungSampah->id,
            'TabungSampah'
        );
    }

    public static function deductPointsForRedemption(
        User $user,
        int $poinDigunakan,
        ?int $penukaranId = null
    ): PoinTransaksi {
        return self::spendPoints(
            $user->user_id,
            $poinDigunakan,
            self::SUMBER_PENUKARAN_PRODUK,
            "Penukaran produk: -{$poinDigunakan} poin",
            $penukaranId,
            'PenukaranProduk'
        );
    }

    /**
     * Deduct points for withdrawal request
     * Updates ONLY actual_poin (display_poin stays for leaderboard)
     *
     * @param User $user
     * @param int $jumlahPoin
     * @param int|null $penarikanId Reference to penarikan_tunai record
     * @return PoinTransaksi
     * @throws \Exception
     */
    public static function deductPointsForWithdrawal(
        User $user,
        int $jumlahPoin,
        ?int $penarikanId = null
    ): PoinTransaksi {
        // Use spendPoints to update ONLY actual_poin
        return self::spendPoints(
            $user->user_id,
            $jumlahPoin,
            self::SUMBER_PENARIKAN_TUNAI,
            "Penarikan tunai: -{$jumlahPoin} poin",
            $penarikanId,
            'PenarikanTunai'
        );
    }

    public static function awardBonusPoints(
        $userId,
        int $points,
        string $reason = 'bonus',
        string $description = '',
        ?int $referensiId = null,
        ?string $referensiTipe = null
    ): PoinTransaksi {
        $sumber = match($reason) {
            'badge_unlock', 'badge_reward', 'badge' => self::SUMBER_BADGE_REWARD,
            'event' => self::SUMBER_EVENT,
            'manual' => self::SUMBER_MANUAL,
            default => self::SUMBER_BONUS,
        };

        return self::earnPoints(
            $userId,
            $points,
            $sumber,
            $description ?: "Bonus poin: +{$points}",
            null,
            $referensiId,
            $referensiTipe
        );
    }

    public static function refundRedemptionPoints(
        int $userId,
        int $points,
        ?int $penukaranId = null
    ): PoinTransaksi {
        if ($penukaranId !== null) {
            $existingRefund = PoinTransaksi::where('user_id', $userId)
                ->where('sumber', self::SUMBER_REFUND_PENUKARAN)
                ->where('referensi_id', $penukaranId)
                ->where('referensi_tipe', 'PenukaranProduk')
                ->first();

            if ($existingRefund) {
                Log::warning('Attempted duplicate refund for redemption', [
                    'user_id' => $userId,
                    'penukaran_id' => $penukaranId,
                    'existing_refund_id' => $existingRefund->poin_transaksi_id,
                ]);
                throw new \Exception("Refund sudah pernah dilakukan untuk penukaran ini (ID: {$penukaranId})");
            }
        }

        return self::refundPoints(
            $userId,
            $points,
            self::SUMBER_REFUND_PENUKARAN,
            "Pengembalian poin dari penukaran #{$penukaranId} yang dibatalkan: +{$points} poin",
            $penukaranId,
            'PenukaranProduk'
        );
    }

    public static function refundWithdrawalPoints(
        int $userId,
        int $points,
        ?int $penarikanId = null
    ): PoinTransaksi {
        if ($penarikanId !== null) {
            $existingRefund = PoinTransaksi::where('user_id', $userId)
                ->where('sumber', self::SUMBER_PENGEMBALIAN_PENARIKAN)
                ->where('referensi_id', $penarikanId)
                ->where('referensi_tipe', 'PenarikanTunai')
                ->first();

            if ($existingRefund) {
                Log::warning('Attempted duplicate refund for withdrawal', [
                    'user_id' => $userId,
                    'penarikan_id' => $penarikanId,
                    'existing_refund_id' => $existingRefund->poin_transaksi_id,
                ]);
                throw new \Exception("Refund sudah pernah dilakukan untuk penarikan ini (ID: {$penarikanId})");
            }
        }

        return self::refundPoints(
            $userId,
            $points,
            self::SUMBER_PENGEMBALIAN_PENARIKAN,
            "Pengembalian poin dari penarikan tunai #{$penarikanId} yang ditolak: +{$points} poin",
            $penarikanId,
            'PenarikanTunai'
        );
    }

    public static function getTransactionHistory(
        int $userId,
        int $limit = 20,
        ?array $sumberFilter = null
    ) {
        $query = PoinTransaksi::where('user_id', $userId);

        if ($sumberFilter) {
            $query->whereIn('sumber', $sumberFilter);
        }

        return $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public static function getTotalEarned(int $userId): int
    {
        return (int) PoinTransaksi::where('user_id', $userId)
            ->where('poin_didapat', '>', 0)
            ->sum('poin_didapat');
    }

    public static function getTotalSpent(int $userId): int
    {
        return (int) abs(
            PoinTransaksi::where('user_id', $userId)
                ->where('poin_didapat', '<', 0)
                ->sum('poin_didapat')
        );
    }

    public static function getStatistics(int $userId): array
    {
        $user = User::findOrFail($userId);
        $earned = self::getTotalEarned($userId);
        $spent = self::getTotalSpent($userId);

        return [
            'current_balance' => $user->actual_poin,
            'total_earned' => $earned,
            'total_spent' => $spent,
            'transaction_count' => PoinTransaksi::where('user_id', $userId)->count(),
            'breakdown' => [
                'from_deposits' => (int) PoinTransaksi::where('user_id', $userId)
                    ->where('sumber', 'setor_sampah')
                    ->sum('poin_didapat'),
                'from_bonuses' => (int) PoinTransaksi::where('user_id', $userId)
                    ->where('sumber', 'bonus')
                    ->sum('poin_didapat'),
                'from_badges' => (int) PoinTransaksi::where('user_id', $userId)
                    ->where('sumber', 'badge')
                    ->sum('poin_didapat'),
                'from_events' => (int) PoinTransaksi::where('user_id', $userId)
                    ->where('sumber', 'event')
                    ->sum('poin_didapat'),
                'spent_on_redemptions' => (int) abs(
                    PoinTransaksi::where('user_id', $userId)
                        ->where('sumber', 'redemption')
                        ->sum('poin_didapat')
                ),
            ],
        ];
    }
}
