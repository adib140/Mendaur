<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds badge_title_id column to users table.
     * This stores the user's selected badge to display as their "title".
     * Only badges that are unlocked (in user_badges) can be selected.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add badge_title_id - nullable foreign key to badges table
            $table->unsignedBigInteger('badge_title_id')->nullable()->after('level');

            // Add foreign key constraint
            $table->foreign('badge_title_id')
                ->references('badge_id')
                ->on('badges')
                ->onDelete('set null'); // If badge deleted, reset to null
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['badge_title_id']);
            $table->dropColumn('badge_title_id');
        });
    }
};
