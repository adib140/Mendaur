<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Drop transaksis table
     *
     * Status: ANALYSIS REQUIRED
     * Note: This table is ACTIVELY USED in TransaksiController
     * Decision: Keep the table - do not drop
     */
    public function up(): void
    {
        // NO ACTION - Table is actively used
        // transaksis table contains important transaction records
        // Dropping would cause data loss - DO NOT EXECUTE
    }

    public function down(): void
    {
        // No rollback needed
    }
};
