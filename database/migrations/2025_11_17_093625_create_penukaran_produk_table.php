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
        Schema::create('penukaran_produk', function (Blueprint $table) {
            $table->id('penukaran_produk_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('produk_id');
            $table->string('nama_produk');
            $table->integer('poin_digunakan');
            $table->integer('jumlah')->default(1);
            $table->enum('status', ['pending', 'approved', 'cancelled',])->default('pending');
            $table->text('metode_ambil');
            $table->text('catatan')->nullable();
            $table->timestamp('tanggal_penukaran')->useCurrent();
            $table->timestamp('tanggal_diambil')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['user_id', 'status'], 'idx_user_status');
            $table->index('created_at', 'idx_created_at');
            
            // Foreign keys with explicit column references
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('produk_id')->references('produk_id')->on('produks')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penukaran_produk');
    }
};
