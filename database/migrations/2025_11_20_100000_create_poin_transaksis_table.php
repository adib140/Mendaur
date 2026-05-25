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
        Schema::create('poin_transaksis', function (Blueprint $table) {
            $table->id('poin_transaksi_id');

            // Foreign keys
            $table->unsignedBigInteger('user_id');

            $table->unsignedBigInteger('tabung_sampah_id')
                ->nullable();

            // Waste deposit info (denormalized for readability)
            $table->string('jenis_sampah')->nullable()->comment('Type of waste');
            $table->decimal('berat_kg', 6, 2)->nullable()->comment('Weight in kg');

            // Point transaction info
            $table->integer('poin_didapat')->comment('Points gained (can be negative for deductions)');
            $table->string('sumber')->default('setor_sampah')->comment('Source: setor_sampah, bonus, event, manual, badge, redemption');
            $table->text('keterangan')->nullable()->comment('Description/note');

            // Reference to related entity (badge, redemption, etc)
            $table->unsignedBigInteger('referensi_id')->nullable()->comment('ID of related entity');
            $table->string('referensi_tipe')->nullable()->comment('Type of related entity: badge, redemption, event, admin');

            $table->timestamps();

            // Indexes for performance
            $table->index('user_id');
            $table->index('sumber');
            $table->index('created_at');
            $table->index(['user_id', 'created_at']);
            $table->index(['user_id', 'sumber']);

            // Prevent duplicate entries for same deposit
            $table->unique(['user_id', 'tabung_sampah_id', 'sumber'], 'unique_user_deposit_source');
            
            // Foreign keys with explicit column references
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->foreign('tabung_sampah_id')->references('tabung_sampah_id')->on('tabung_sampah')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poin_transaksis');
    }
};
