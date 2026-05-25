<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add indexes for better query performance
     */
    public function up(): void
    {
        // Index for tabung_sampah queries
        Schema::table('tabung_sampah', function (Blueprint $table) {
            if (!$this->hasIndex('tabung_sampah', 'idx_tabung_user_status')) {
                $table->index(['user_id', 'status'], 'idx_tabung_user_status');
            }
            if (!$this->hasIndex('tabung_sampah', 'idx_tabung_created')) {
                $table->index('created_at', 'idx_tabung_created');
            }
        });

        // Index for penukaran_produk queries
        Schema::table('penukaran_produk', function (Blueprint $table) {
            if (!$this->hasIndex('penukaran_produk', 'idx_penukaran_user_status')) {
                $table->index(['user_id', 'status'], 'idx_penukaran_user_status');
            }
            if (!$this->hasIndex('penukaran_produk', 'idx_penukaran_created')) {
                $table->index('created_at', 'idx_penukaran_created');
            }
        });

        // Index for penarikan_tunai queries
        Schema::table('penarikan_tunai', function (Blueprint $table) {
            if (!$this->hasIndex('penarikan_tunai', 'idx_penarikan_user_status')) {
                $table->index(['user_id', 'status'], 'idx_penarikan_user_status');
            }
            if (!$this->hasIndex('penarikan_tunai', 'idx_penarikan_created')) {
                $table->index('created_at', 'idx_penarikan_created');
            }
        });

        // Index for log_aktivitas queries  
        Schema::table('log_aktivitas', function (Blueprint $table) {
            if (!$this->hasIndex('log_aktivitas', 'idx_log_user_tanggal')) {
                $table->index(['user_id', 'tanggal'], 'idx_log_user_tanggal');
            }
        });

        // Index for users leaderboard queries
        Schema::table('users', function (Blueprint $table) {
            if (!$this->hasIndex('users', 'idx_users_display_poin')) {
                $table->index('display_poin', 'idx_users_display_poin');
            }
            if (!$this->hasIndex('users', 'idx_users_level')) {
                $table->index('level', 'idx_users_level');
            }
        });

        // Index for badge queries
        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                if (!$this->hasIndex('user_badges', 'idx_user_badges_user')) {
                    $table->index('user_id', 'idx_user_badges_user');
                }
            });
        }

        if (Schema::hasTable('badge_progress')) {
            Schema::table('badge_progress', function (Blueprint $table) {
                if (!$this->hasIndex('badge_progress', 'idx_badge_progress_user')) {
                    $table->index('user_id', 'idx_badge_progress_user');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tabung_sampah', function (Blueprint $table) {
            $table->dropIndex('idx_tabung_user_status');
            $table->dropIndex('idx_tabung_created');
        });

        Schema::table('penukaran_produk', function (Blueprint $table) {
            $table->dropIndex('idx_penukaran_user_status');
            $table->dropIndex('idx_penukaran_created');
        });

        Schema::table('penarikan_tunai', function (Blueprint $table) {
            $table->dropIndex('idx_penarikan_user_status');
            $table->dropIndex('idx_penarikan_created');
        });

        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->dropIndex('idx_log_user_tanggal');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_display_poin');
            $table->dropIndex('idx_users_level');
        });

        if (Schema::hasTable('user_badges')) {
            Schema::table('user_badges', function (Blueprint $table) {
                $table->dropIndex('idx_user_badges_user');
            });
        }

        if (Schema::hasTable('badge_progress')) {
            Schema::table('badge_progress', function (Blueprint $table) {
                $table->dropIndex('idx_badge_progress_user');
            });
        }
    }

    /**
     * Check if index exists
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $indexes = Schema::getIndexes($table);
        foreach ($indexes as $index) {
            if ($index['name'] === $indexName) {
                return true;
            }
        }
        return false;
    }
};
