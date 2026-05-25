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
        Schema::create('badge_progress', function (Blueprint $table) {
            $table->id('badge_progress_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('badge_id');
            $table->integer('current_value')->default(0); // Current points or setor count
            $table->integer('target_value')->default(0); // Required points or setor count
            $table->decimal('progress_percentage', 5, 2)->default(0.00); // 0.00 to 100.00
            $table->boolean('is_unlocked')->default(false);
            $table->timestamp('unlocked_at')->nullable();
            $table->timestamps();

            // Prevent duplicate progress records
            $table->unique(['user_id', 'badge_id']);

            // Indexes for better query performance
            $table->index(['user_id', 'is_unlocked']);
            $table->index('progress_percentage');
            
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
        Schema::dropIfExists('badge_progress');
    }
};
