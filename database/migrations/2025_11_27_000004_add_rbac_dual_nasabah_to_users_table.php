<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add RBAC and dual-nasabah columns to users table
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // RBAC
            $table->unsignedBigInteger('role_id')->nullable()->after('user_id');
            $table->foreign('role_id')->references('role_id')->on('roles')->onDelete('set null');

            // Dual-nasabah system
            $table->enum('tipe_nasabah', ['konvensional', 'modern'])->default('konvensional')->after('level')
                ->comment('Tipe nasabah: konvensional (poin usable), modern (poin tercatat only)');
            $table->integer('poin_tercatat')->default(0)->after('total_poin')
                ->comment('Recorded points for audit/badges - usable by both types');

            // Banking info for withdrawal feature (Modern users ONLY)
            // NOTE: Konvensional users should NOT have banking info - will be NULL
            // Only Modern users need banking info for withdrawal feature
            $table->string('nama_bank')->nullable()->after('poin_tercatat')
                ->comment('Bank name - only for modern users (konvensional = NULL)');
            $table->string('nomor_rekening')->nullable()->after('nama_bank')
                ->comment('Account number - only for modern users');
            $table->string('atas_nama_rekening')->nullable()->after('nomor_rekening')
                ->comment('Account holder name - only for modern users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
            $table->dropColumn('tipe_nasabah');
            $table->dropColumn('poin_tercatat');
            $table->dropColumn('nama_bank');
            $table->dropColumn('nomor_rekening');
            $table->dropColumn('atas_nama_rekening');
        });
    }
};
