<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Drop unused tables from Mendaur system
     *
     * Tabel yang akan dihapus:
     * - cache: Laravel cache storage (not used, using Redis/no-store)
     * - cache_locks: Cache lock mechanism (not used)
     * - failed_jobs: Queue failed jobs (no queue implementation)
     * - jobs: Database queue jobs (not implemented)
     * - job_batches: Job batch processing (not used)
     *
     * BACKUP DATABASE SEBELUM MENJALANKAN MIGRATION INI!
     *
     * Execution:
     * $ php artisan migrate
     *
     * Rollback (jika ada masalah):
     * $ php artisan migrate:rollback
     */
    public function up(): void
    {
        // Disable foreign key checks saat proses drop
        Schema::disableForeignKeyConstraints();

        try {
            // Drop cache_locks first (no dependencies)
            if (Schema::hasTable('cache_locks')) {
                Schema::dropIfExists('cache_locks');
                echo "✓ Dropped: cache_locks\n";
            }

            // Drop cache (no dependencies)
            if (Schema::hasTable('cache')) {
                Schema::dropIfExists('cache');
                echo "✓ Dropped: cache\n";
            }

            // Drop job_batches first (no FK, but logically depends on jobs)
            if (Schema::hasTable('job_batches')) {
                Schema::dropIfExists('job_batches');
                echo "✓ Dropped: job_batches\n";
            }

            // Drop failed_jobs (no FK)
            if (Schema::hasTable('failed_jobs')) {
                Schema::dropIfExists('failed_jobs');
                echo "✓ Dropped: failed_jobs\n";
            }

            // Drop jobs (no FK)
            if (Schema::hasTable('jobs')) {
                Schema::dropIfExists('jobs');
                echo "✓ Dropped: jobs\n";
            }

            echo "\n✓ All unused tables dropped successfully!\n";
        } finally {
            // Re-enable foreign key constraints
            Schema::enableForeignKeyConstraints();
        }
    }

    /**
     * Reverse the migrations - Recreate dropped tables
     *
     * Execution:
     * $ php artisan migrate:rollback
     */
    public function down(): void
    {
        // Disable foreign key checks during recreation
        Schema::disableForeignKeyConstraints();

        try {
            // Recreate jobs table
            if (!Schema::hasTable('jobs')) {
                Schema::create('jobs', function (Blueprint $table) {
                    $table->bigIncrements('id');
                    $table->string('queue')->index();
                    $table->longText('payload');
                    $table->unsignedTinyInteger('attempts')->default(0);
                    $table->unsignedInteger('reserved_at')->nullable();
                    $table->unsignedInteger('available_at');
                    $table->unsignedInteger('created_at');
                });
                echo "✓ Created: jobs\n";
            }

            // Recreate failed_jobs table
            if (!Schema::hasTable('failed_jobs')) {
                Schema::create('failed_jobs', function (Blueprint $table) {
                    $table->id();
                    $table->string('uuid')->unique();
                    $table->text('connection');
                    $table->text('queue');
                    $table->longText('payload');
                    $table->longText('exception');
                    $table->timestamp('failed_at')->useCurrent();
                });
                echo "✓ Created: failed_jobs\n";
            }

            // Recreate job_batches table
            if (!Schema::hasTable('job_batches')) {
                Schema::create('job_batches', function (Blueprint $table) {
                    $table->id();
                    $table->string('name');
                    $table->integer('total_jobs');
                    $table->integer('pending_jobs');
                    $table->integer('failed_jobs');
                    $table->longText('failed_job_ids')->nullable();
                    $table->text('options')->nullable();
                    $table->dateTime('created_at');
                    $table->dateTime('cancelled_at')->nullable();
                });
                echo "✓ Created: job_batches\n";
            }

            // Recreate cache table
            if (!Schema::hasTable('cache')) {
                Schema::create('cache', function (Blueprint $table) {
                    $table->string('key')->unique();
                    $table->mediumText('value');
                    $table->integer('expiration');
                });
                echo "✓ Created: cache\n";
            }

            // Recreate cache_locks table
            if (!Schema::hasTable('cache_locks')) {
                Schema::create('cache_locks', function (Blueprint $table) {
                    $table->string('key')->unique();
                    $table->string('owner');
                    $table->integer('expiration');
                });
                echo "✓ Created: cache_locks\n";
            }

            echo "\n✓ All tables recreated successfully!\n";
        } finally {
            // Re-enable foreign key constraints
            Schema::enableForeignKeyConstraints();
        }
    }
};
