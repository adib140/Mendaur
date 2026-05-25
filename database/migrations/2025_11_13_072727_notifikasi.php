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
        Schema::create('notifikasi', function (Blueprint $table) {
            $table->id('notifikasi_id');
            $table->unsignedBigInteger('user_id');
            $table->string('judul');
            $table->text('pesan');
            $table->string('tipe')->default('info'); // Changed from enum to string for flexibility
            $table->boolean('is_read')->default(false); // Changed from 'dibaca' to 'is_read'
            $table->unsignedBigInteger('related_id')->nullable(); // For linking to related records
            $table->string('related_type')->nullable(); // Polymorphic type
            $table->timestamps();
            
            // Foreign key with explicit column reference
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifikasi');
    }
};
