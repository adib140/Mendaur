<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop jenis_sampah_new table
     *
     * Status: UNUSED - No active references in controllers or production seeders
     * Migration: Reverting test/experimental table
     */
    public function up(): void
    {
        Schema::dropIfExists('jenis_sampah_new');
    }

    public function down(): void
    {
        Schema::create('jenis_sampah_new', function (Blueprint $table) {
            $table->id();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });
    }
};
