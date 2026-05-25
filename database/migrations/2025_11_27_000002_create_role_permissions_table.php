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
        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id('role_permission_id');
            $table->unsignedBigInteger('role_id');
            $table->string('permission_code')->comment('e.g., deposit_sampah, approve_deposit');
            $table->text('deskripsi')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('role_id')->references('role_id')->on('roles')->onDelete('cascade');

            // Unique constraint: each role has each permission only once
            $table->unique(['role_id', 'permission_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permissions');
    }
};
