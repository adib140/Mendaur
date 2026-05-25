<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BadgeSeeder extends Seeder
{
    public function run(): void
    {
        // Seed badges using updateOrInsert (skip existing)
        $badges = [
            [
                'nama' => 'Pemula Peduli',
                'deskripsi' => 'Setor sampah pertama kali',
                'icon' => '🌱',
                'syarat_poin' => 0,
                'syarat_setor' => 1,
                'reward_poin' => 50,
                'tipe' => 'setor',
            ],
            [
                'nama' => 'Eco Warrior',
                'deskripsi' => 'Setor sampah 5 kali',
                'icon' => '♻️',
                'syarat_poin' => 0,
                'syarat_setor' => 5,
                'reward_poin' => 100,
                'tipe' => 'setor',
            ],
            [
                'nama' => 'Green Hero',
                'deskripsi' => 'Setor sampah 10 kali',
                'icon' => '🦸',
                'syarat_poin' => 0,
                'syarat_setor' => 10,
                'reward_poin' => 200,
                'tipe' => 'setor',
            ],
            [
                'nama' => 'Planet Saver',
                'deskripsi' => 'Setor sampah 25 kali',
                'icon' => '🌍',
                'syarat_poin' => 0,
                'syarat_setor' => 25,
                'reward_poin' => 500,
                'tipe' => 'setor',
            ],
            [
                'nama' => 'Bronze Collector',
                'deskripsi' => 'Mencapai 100 poin',
                'icon' => '🥉',
                'syarat_poin' => 100,
                'syarat_setor' => 0,
                'reward_poin' => 100,
                'tipe' => 'poin',
            ],
            [
                'nama' => 'Silver Collector',
                'deskripsi' => 'Mencapai 300 poin',
                'icon' => '🥈',
                'syarat_poin' => 300,
                'syarat_setor' => 0,
                'reward_poin' => 200,
                'tipe' => 'poin',
            ],
            [
                'nama' => 'Gold Collector',
                'deskripsi' => 'Mencapai 600 poin',
                'icon' => '🥇',
                'syarat_poin' => 600,
                'syarat_setor' => 0,
                'reward_poin' => 400,
                'tipe' => 'poin',
            ],
            [
                'nama' => 'Capai Ranking 10',
                'deskripsi' => 'Masuk 10 besar leaderboard',
                'icon' => '🏅',
                'syarat_poin' => 0,
                'syarat_setor' => 0,
                'reward_poin' => 150,
                'tipe' => 'ranking',
            ],
            [
                'nama' => 'Capai Ranking 5',
                'deskripsi' => 'Masuk 5 besar leaderboard',
                'icon' => '🥇',
                'syarat_poin' => 0,
                'syarat_setor' => 0,
                'reward_poin' => 300,
                'tipe' => 'ranking',
            ],
            [
                'nama' => 'Capai Ranking 1',
                'deskripsi' => 'Menjadi juara #1 leaderboard',
                'icon' => '👑',
                'syarat_poin' => 0,
                'syarat_setor' => 0,
                'reward_poin' => 500,
                'tipe' => 'ranking',
            ],
        ];

        foreach ($badges as $badge) {
            DB::table('badges')->updateOrInsert(
                ['nama' => $badge['nama']], // Unique key
                array_merge($badge, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        // Get badge IDs dynamically
        $badgeIds = [];
        foreach ($badges as $badge) {
            $badgeIds[$badge['nama']] = DB::table('badges')->where('nama', $badge['nama'])->value('badge_id');
        }

        // Give badges to users based on their activity (skip if already exists)
        $userBadges = [
            // User 1 (Adib) - 5 setor, 150 poin, Bronze
            ['user_id' => 1, 'badge_nama' => 'Pemula Peduli', 'days_ago' => 30],
            ['user_id' => 1, 'badge_nama' => 'Eco Warrior', 'days_ago' => 15],
            ['user_id' => 1, 'badge_nama' => 'Bronze Collector', 'days_ago' => 10],
            // User 2 (Siti) - 12 setor, 300 poin, Silver
            ['user_id' => 2, 'badge_nama' => 'Pemula Peduli', 'days_ago' => 60],
            ['user_id' => 2, 'badge_nama' => 'Eco Warrior', 'days_ago' => 50],
            ['user_id' => 2, 'badge_nama' => 'Green Hero', 'days_ago' => 30],
            ['user_id' => 2, 'badge_nama' => 'Bronze Collector', 'days_ago' => 35],
            ['user_id' => 2, 'badge_nama' => 'Silver Collector', 'days_ago' => 20],
            // User 3 (Budi) - 2 setor, 50 poin, Pemula
            ['user_id' => 3, 'badge_nama' => 'Pemula Peduli', 'days_ago' => 7],
        ];

        foreach ($userBadges as $ub) {
            $badgeId = $badgeIds[$ub['badge_nama']] ?? null;
            if ($badgeId) {
                DB::table('user_badges')->updateOrInsert(
                    ['user_id' => $ub['user_id'], 'badge_id' => $badgeId], // Unique key
                    [
                        'user_id' => $ub['user_id'],
                        'badge_id' => $badgeId,
                        'tanggal_dapat' => now()->subDays($ub['days_ago']),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }
}
