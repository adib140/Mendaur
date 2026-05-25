<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Reset foto fields yang masih menggunakan local storage path
     * karena Railway tidak menyimpan file storage secara persisten
     */
    public function up(): void
    {
        // Reset foto produk yang bukan URL (local storage paths)
        DB::table('produks')
            ->whereNotNull('foto')
            ->where('foto', 'NOT LIKE', 'http%')
            ->update(['foto' => null]);

        // Reset foto_cover artikel yang bukan URL
        DB::table('artikels')
            ->whereNotNull('foto_cover')
            ->where('foto_cover', 'NOT LIKE', 'http%')
            ->update(['foto_cover' => null]);

        // Reset foto_sampah yang bukan URL
        DB::table('tabung_sampah')
            ->whereNotNull('foto_sampah')
            ->where('foto_sampah', 'NOT LIKE', 'http%')
            ->update(['foto_sampah' => null]);

        // Note: User foto_profil should already be Cloudinary URLs
        // But reset any that aren't just in case
        DB::table('users')
            ->whereNotNull('foto_profil')
            ->where('foto_profil', 'NOT LIKE', 'http%')
            ->update(['foto_profil' => null]);
    }

    /**
     * Reverse the migrations.
     * Cannot restore original paths - this is a one-way migration
     */
    public function down(): void
    {
        // Cannot reverse - original file paths are lost
        // This migration is intentionally one-way
    }
};
