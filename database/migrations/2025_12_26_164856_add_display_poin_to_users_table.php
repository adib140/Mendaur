<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Rename existing total_poin to display_poin untuk leaderboard
            $table->renameColumn('total_poin', 'display_poin');

            // Add new actual_poin column untuk transaksi/withdrawal
            $table->integer('actual_poin')->default(0)->after('display_poin')
                ->comment('Actual points calculated from poin_transaksis - for transactions/withdrawals');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop actual_poin column
            $table->dropColumn('actual_poin');

            // Rename back display_poin to total_poin
            $table->renameColumn('display_poin', 'total_poin');
        });
    }
};
