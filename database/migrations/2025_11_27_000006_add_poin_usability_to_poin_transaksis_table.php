<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add poin usability tracking to poin_transaksis table
     */
    public function up(): void
    {
        Schema::table('poin_transaksis', function (Blueprint $table) {
            $table->boolean('is_usable')->default(true)->after('poin_didapat')
                ->comment('Whether this poin transaction can be used for features');
            $table->string('reason_not_usable')->nullable()->after('is_usable')
                ->comment('Reason why poin is not usable (e.g., modern_nasabah_type)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('poin_transaksis', function (Blueprint $table) {
            $table->dropColumn('is_usable');
            $table->dropColumn('reason_not_usable');
        });
    }
};
