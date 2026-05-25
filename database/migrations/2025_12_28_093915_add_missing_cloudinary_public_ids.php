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
        // Only add columns that don't exist yet
        Schema::table('tabung_sampah', function (Blueprint $table) {
            if (!Schema::hasColumn('tabung_sampah', 'foto_sampah_public_id')) {
                $table->string('foto_sampah_public_id')->nullable()->after('foto_sampah');
            }
        });
        
        Schema::table('produks', function (Blueprint $table) {
            if (!Schema::hasColumn('produks', 'foto_public_id')) {
                $table->string('foto_public_id')->nullable()->after('foto');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tabung_sampah', function (Blueprint $table) {
            if (Schema::hasColumn('tabung_sampah', 'foto_sampah_public_id')) {
                $table->dropColumn('foto_sampah_public_id');
            }
        });
        
        Schema::table('produks', function (Blueprint $table) {
            if (Schema::hasColumn('produks', 'foto_public_id')) {
                $table->dropColumn('foto_public_id');
            }
        });
    }
};
