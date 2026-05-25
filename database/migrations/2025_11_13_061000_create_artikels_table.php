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
        Schema::create('artikels', function (Blueprint $table) {
            $table->id('artikel_id');
            $table->string('judul');
            $table->string('slug')->unique();
            $table->longText('konten');
            $table->string('foto_cover')->nullable();
            $table->string('penulis');
            $table->string('kategori');
            $table->date('tanggal_publikasi');
            $table->integer('views')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('artikels');
    }
};
