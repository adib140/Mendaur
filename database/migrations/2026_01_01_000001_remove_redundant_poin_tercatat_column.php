<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration: Hapus kolom poin_tercatat yang redundant
 *
 * Kolom poin_tercatat memiliki fungsi yang sama dengan display_poin,
 * yaitu menyimpan total poin historis. Untuk menghindari redundansi,
 * kita hapus poin_tercatat dan gunakan display_poin saja.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Sebelum hapus, sync data poin_tercatat ke display_poin jika berbeda
        // (opsional - uncomment jika perlu)
        // DB::statement('UPDATE users SET display_poin = poin_tercatat WHERE poin_tercatat > display_poin');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'poin_tercatat')) {
                $table->dropColumn('poin_tercatat');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'poin_tercatat')) {
                $table->integer('poin_tercatat')->default(0)->after('actual_poin');
            }
        });
    }
};
