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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id('audit_log_id');
            $table->unsignedBigInteger('admin_id');
            $table->string('action_type')->comment('create, update, delete, approve, reject, etc');
            $table->string('resource_type')->comment('TabungSampah, PenarikanTunai, etc');
            $table->unsignedBigInteger('resource_id');
            $table->longText('old_values')->nullable()->comment('JSON of old state');
            $table->longText('new_values')->nullable()->comment('JSON of new state');
            $table->text('reason')->nullable()->comment('Why this action was taken');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->text('error_message')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('admin_id')->references('user_id')->on('users')->onDelete('cascade');

            // Indexes for faster queries
            $table->index('admin_id');
            $table->index('resource_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
