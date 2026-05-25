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
        Schema::create('produks', function (Blueprint $table) {
            $table->id('produk_id');
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->integer('harga_poin');
            $table->integer('stok')->default(0);
            $table->string('kategori');
            $table->string('foto')->nullable();
            $table->enum('status', ['tersedia', 'habis', 'nonaktif'])->default('tersedia');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produks');
    }
};
