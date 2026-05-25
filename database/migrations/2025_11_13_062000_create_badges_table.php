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
        Schema::create('badges', function (Blueprint $table) {
            $table->id('badge_id');
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->string('icon')->nullable();
            $table->integer('syarat_poin')->default(0);
            $table->integer('syarat_setor')->default(0);
            $table->integer('reward_poin')->default(0); // ✨ Bonus points for unlocking
            $table->enum('tipe', ['poin', 'setor', 'kombinasi', 'special', 'ranking'])->default('poin');
            $table->timestamps();
        });

        Schema::create('user_badges', function (Blueprint $table) {
            $table->id('user_badge_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('badge_id');
            $table->timestamp('tanggal_dapat')->useCurrent();
            $table->boolean('reward_claimed')->default(true); // ✨ Track if reward was given
            $table->timestamps();
            $table->unique(['user_id', 'badge_id'], 'unique_user_badge');
            
            // Foreign keys with explicit column references
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('badge_id')->references('badge_id')->on('badges')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_badges');
        Schema::dropIfExists('badges');
    }
};
