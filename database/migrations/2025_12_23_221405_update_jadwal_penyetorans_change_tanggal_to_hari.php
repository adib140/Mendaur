<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Perubahan:
     * 1. Kolom 'tanggal' (date) -> 'hari' (enum: Senin-Minggu)
     * 2. Kolom 'status' -> enum 'Buka', 'Tutup' (dengan capital)
     * 3. Hapus kolom 'kapasitas'
     */
    public function up(): void
    {
        // Step 1: Drop kolom kapasitas
        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->dropColumn('kapasitas');
        });

        // Step 2: Rename tanggal to hari and change type
        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->dropColumn('tanggal');
        });

        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->enum('hari', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'])
                  ->after('jadwal_penyetoran_id');
        });

        // Step 3: Modify status enum values
        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->enum('status', ['Buka', 'Tutup'])->default('Buka')->after('lokasi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert status
        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->enum('status', ['buka', 'tutup'])->nullable()->after('lokasi');
        });

        // Revert hari back to tanggal
        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->dropColumn('hari');
        });

        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->date('tanggal')->after('jadwal_penyetoran_id');
        });

        // Add back kapasitas
        Schema::table('jadwal_penyetorans', function (Blueprint $table) {
            $table->integer('kapasitas')->nullable()->after('lokasi');
        });
    }
};
