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
        Schema::create('log_aktivitas', function (Blueprint $table) {
            $table->id('log_user_activity_id');
            $table->unsignedBigInteger('user_id');
            $table->string('tipe_aktivitas', 50);
            $table->text('deskripsi')->nullable();
            $table->integer('poin_perubahan')->default(0);
            $table->timestamp('tanggal')->useCurrent();
            $table->timestamp('created_at')->useCurrent();

            // Index for performance
            $table->index(['user_id', 'tanggal'], 'idx_user_tanggal');
            
            // Foreign key with explicit column reference
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('log_aktivitas');
    }
};
