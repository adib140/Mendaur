<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jenis_sampah', function (Blueprint $table) {
            $table->id('jenis_sampah_id');
            $table->foreignId('kategori_sampah_id')
                ->constrained('kategori_sampah', 'kategori_sampah_id')
                ->onDelete('cascade');
            $table->string('nama_jenis', 100);
            $table->decimal('harga_per_kg', 10, 2);
            $table->string('satuan', 20)->default('kg');
            $table->string('kode', 20)->unique()->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Indexes for better performance
            $table->index(['kategori_sampah_id', 'is_active']);
            $table->index('kode');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jenis_sampah');
    }
};
