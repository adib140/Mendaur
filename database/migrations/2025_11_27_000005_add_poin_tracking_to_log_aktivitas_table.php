<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add poin tracking columns to log_aktivitas table
     */
    public function up(): void
    {
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->integer('poin_tercatat')->default(0)->after('poin_perubahan')
                ->comment('Recorded points (audit trail)');
            $table->integer('poin_usable')->default(0)->after('poin_tercatat')
                ->comment('Usable points (only for konvensional nasabah)');
            $table->string('source_tipe')->nullable()->after('poin_usable')
                ->comment('tabung_sampah, penarikan_tunai, penukaran_produk, etc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('log_aktivitas', function (Blueprint $table) {
            $table->dropColumn('poin_tercatat');
            $table->dropColumn('poin_usable');
            $table->dropColumn('source_tipe');
        });
    }
};
