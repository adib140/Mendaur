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
        Schema::create('poin_corrections', function (Blueprint $table) {
            $table->id('poin_correction_id');

            // Foreign keys
            $table->unsignedBigInteger('superadmin_id')->comment('Superadmin who made the correction');
            $table->unsignedBigInteger('nasabah_id')->comment('Nasabah whose poin was corrected');

            // Poin values
            $table->integer('old_value')->comment('Previous poin value');
            $table->integer('new_value')->comment('New poin value after correction');
            $table->integer('difference')->comment('Difference (new - old)');

            // Correction details
            $table->string('type')->default('correction')->comment('Type: correction, reversal, fraud_prevention, system_fix');
            $table->text('reason')->nullable()->comment('Reason for correction');
            $table->text('notes')->nullable()->comment('Additional notes');
            $table->string('status')->default('approved')->comment('Status: active, pending_review, approved, rejected');

            // Reversal tracking
            $table->boolean('is_reversed')->default(false)->comment('Whether this correction has been reversed');
            $table->unsignedBigInteger('reversed_by')->nullable()->comment('Superadmin who reversed this correction');
            $table->timestamp('reversed_at')->nullable()->comment('When this correction was reversed');

            // Timestamps
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('superadmin_id');
            $table->index('nasabah_id');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
            $table->index('is_reversed');
            $table->index(['nasabah_id', 'created_at']);
            $table->index(['superadmin_id', 'created_at']);

            // Foreign key constraints
            $table->foreign('superadmin_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            $table->foreign('nasabah_id')
                ->references('user_id')
                ->on('users')
                ->onDelete('cascade')
                ->onUpdate('cascade');

            $table->foreign('reversed_by')
                ->references('user_id')
                ->on('users')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poin_corrections');
    }
};
