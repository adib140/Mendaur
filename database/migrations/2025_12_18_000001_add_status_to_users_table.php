<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add user status column (separate from tipe_nasabah which is user type)
     *
     * Status: active, inactive, suspended
     * Type (tipe_nasabah): konvensional, modern
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add status column for user account status
            // This is different from tipe_nasabah which is the user TYPE (konvensional/modern)
            $table->enum('status', ['active', 'inactive', 'suspended'])
                ->default('active')
                ->after('level')
                ->comment('User account status: active, inactive, or suspended. Different from tipe_nasabah (user type)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
