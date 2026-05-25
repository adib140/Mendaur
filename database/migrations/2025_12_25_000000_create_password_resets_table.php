<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Create password_resets table for OTP-based password recovery
     */
    public function up(): void
    {
        Schema::create('password_resets', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('token'); // Hashed token (legacy Laravel compatibility)
            $table->string('otp', 6); // Plain 6-digit OTP for verification
            $table->string('reset_token')->nullable(); // Token for password reset step
            $table->timestamp('expires_at'); // OTP expiration time
            $table->timestamp('verified_at')->nullable(); // When OTP was verified
            $table->timestamps(); // This creates both created_at and updated_at properly

            // Indexes for performance
            $table->index(['email', 'expires_at']);
            $table->index(['email', 'verified_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('password_resets');
    }
};
