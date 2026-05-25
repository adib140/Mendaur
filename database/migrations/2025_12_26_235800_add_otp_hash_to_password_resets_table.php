<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add otp_hash column for secure OTP storage
     * Keep 'otp' column for backward compatibility during transition
     */
    public function up(): void
    {
        Schema::table('password_resets', function (Blueprint $table) {
            $table->string('otp_hash')->nullable()->after('otp')
                ->comment('Hashed OTP for secure verification');

            // Add index for performance
            $table->index('otp_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('password_resets', function (Blueprint $table) {
            $table->dropIndex(['otp_hash']);
            $table->dropColumn('otp_hash');
        });
    }
};
