<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Performance indexes for analytics queries
     */
    public function up(): void
    {
        // Indexes for tabung_sampah (waste deposits)
        Schema::table('tabung_sampah', function (Blueprint $table) {
            // Index for filtering by status and date
            $table->index(['status', 'created_at'], 'idx_tabung_status_created');

            // Index for filtering by user and status
            $table->index(['user_id', 'status'], 'idx_tabung_user_status');

            // Index for filtering by jenis_sampah (category)
            $table->index('jenis_sampah', 'idx_tabung_jenis_sampah');
        });

        // Indexes for poin_transaksis (points history)
        Schema::table('poin_transaksis', function (Blueprint $table) {
            // Index for filtering by created_at (for monthly aggregation)
            $table->index('created_at', 'idx_poin_created');

            // Index for filtering by user
            $table->index(['user_id', 'created_at'], 'idx_poin_user_created');

            // Index for filtering by source
            $table->index('sumber', 'idx_poin_sumber');
        });

        // Index for penukaran_produk (redemptions)
        Schema::table('penukaran_produk', function (Blueprint $table) {
            // Index for filtering by status and date
            $table->index(['status', 'created_at'], 'idx_penukaran_status_created');

            // Index for filtering by user
            $table->index(['user_id', 'status'], 'idx_penukaran_user_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tabung_sampah', function (Blueprint $table) {
            $table->dropIndex('idx_tabung_status_created');
            $table->dropIndex('idx_tabung_user_status');
            $table->dropIndex('idx_tabung_jenis_sampah');
        });

        Schema::table('poin_transaksis', function (Blueprint $table) {
            $table->dropIndex('idx_poin_created');
            $table->dropIndex('idx_poin_user_created');
            $table->dropIndex('idx_poin_sumber');
        });

        Schema::table('penukaran_produk', function (Blueprint $table) {
            $table->dropIndex('idx_penukaran_status_created');
            $table->dropIndex('idx_penukaran_user_status');
        });
    }
};
