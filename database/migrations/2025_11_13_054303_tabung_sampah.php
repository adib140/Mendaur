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
        Schema::create('tabung_sampah', function (Blueprint $table) {
            $table->id('tabung_sampah_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('jadwal_penyetoran_id');
            $table->string('nama_lengkap');
            $table->string('no_hp');
            $table->text('titik_lokasi');
            $table->string('jenis_sampah');
            $table->decimal('berat_kg', 8, 2)->default(0);
            $table->text('foto_sampah')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('poin_didapat')->default(0);
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('jadwal_penyetoran_id')->references('jadwal_penyetoran_id')->on('jadwal_penyetorans')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tabung_sampah');
    }
};
