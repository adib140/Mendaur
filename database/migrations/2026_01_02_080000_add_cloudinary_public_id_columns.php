<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add Cloudinary public_id columns for photo management
     */
    public function up(): void
    {
        // Add foto_cover_public_id to artikels table
        if (Schema::hasTable('artikels') && !Schema::hasColumn('artikels', 'foto_cover_public_id')) {
            Schema::table('artikels', function (Blueprint $table) {
                $table->string('foto_cover_public_id')->nullable()->after('foto_cover');
            });
        }

        // Add foto_public_id to produks table if not exists
        if (Schema::hasTable('produks') && !Schema::hasColumn('produks', 'foto_public_id')) {
            Schema::table('produks', function (Blueprint $table) {
                $table->string('foto_public_id')->nullable()->after('foto');
            });
        }

        // Add foto_sampah_public_id to tabung_sampah table if not exists
        if (Schema::hasTable('tabung_sampah') && !Schema::hasColumn('tabung_sampah', 'foto_sampah_public_id')) {
            Schema::table('tabung_sampah', function (Blueprint $table) {
                $table->string('foto_sampah_public_id')->nullable()->after('foto_sampah');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('artikels', 'foto_cover_public_id')) {
            Schema::table('artikels', function (Blueprint $table) {
                $table->dropColumn('foto_cover_public_id');
            });
        }

        if (Schema::hasColumn('produks', 'foto_public_id')) {
            Schema::table('produks', function (Blueprint $table) {
                $table->dropColumn('foto_public_id');
            });
        }

        if (Schema::hasColumn('tabung_sampah', 'foto_sampah_public_id')) {
            Schema::table('tabung_sampah', function (Blueprint $table) {
                $table->dropColumn('foto_sampah_public_id');
            });
        }
    }
};
