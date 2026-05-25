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
    Schema::create('transaksis', function (Blueprint $table) {
        $table->id('transaksi_id');
        $table->unsignedBigInteger('user_id');
        $table->unsignedBigInteger('produk_id');
        $table->unsignedBigInteger('kategori_id');
        $table->integer('jumlah');
        $table->integer('total_poin');
        $table->enum('status', ['pending', 'diproses', 'dikirim', 'selesai', 'dibatalkan'])->default('pending');
        $table->string('metode_pengiriman')->nullable();
        $table->text('alamat_pengiriman')->nullable();
        $table->timestamps();
        
        // Foreign keys with explicit column references
        $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        $table->foreign('produk_id')->references('produk_id')->on('produks')->onDelete('cascade');
        $table->foreign('kategori_id')->references('kategori_id')->on('kategori_transaksi')->onDelete('cascade');
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};
