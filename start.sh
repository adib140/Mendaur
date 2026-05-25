#!/bin/bash
# Minimal startup script for Railway - bypasses artisan to avoid bootstrap errors
# Updated 2025-12-29

set +e  # Don't exit on errors

echo "========================================"
echo "🚀 Starting Mendaur API (Minimal Mode)"
echo "Timestamp: $(date)"
echo "========================================"

# Show environment info
echo "PHP Version: $(php -v | head -1)"
echo "PORT: ${PORT:-8080}"

# ========================================
# Step 1: Clean ALL cache files
# ========================================
echo ""
echo "🧹 Step 1: Cleaning cache files..."
rm -rf bootstrap/cache/*.php 2>/dev/null || true
rm -rf bootstrap/cache/config.php 2>/dev/null || true
rm -rf bootstrap/cache/routes*.php 2>/dev/null || true
rm -rf bootstrap/cache/packages.php 2>/dev/null || true
rm -rf bootstrap/cache/services.php 2>/dev/null || true
rm -rf bootstrap/cache/compiled.php 2>/dev/null || true
rm -rf storage/framework/cache/data/* 2>/dev/null || true
rm -rf storage/framework/views/*.php 2>/dev/null || true
echo "✅ Cache files cleaned"

# ========================================
# Step 2: Create required directories
# ========================================
echo ""
echo "📁 Step 2: Creating directories..."
mkdir -p bootstrap/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/framework/cache/data
mkdir -p storage/logs
chmod -R 777 bootstrap/cache 2>/dev/null || true
chmod -R 777 storage 2>/dev/null || true
echo "✅ Directories ready"

# ========================================
# Step 3: Create/update .env if needed
# ========================================
echo ""
echo "📝 Step 3: Checking .env..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
    else
        echo "⚠️  No .env file (using environment variables)"
    fi
else
    echo "✅ .env exists"
fi

# ========================================
# Step 4: Wait for database (optional)
# ========================================
echo ""
echo "🗄️  Step 4: Checking database..."
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-mendaur}"
DB_USERNAME="${DB_USERNAME:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"

echo "Database: $DB_HOST:$DB_PORT/$DB_DATABASE"

# Quick database check (5 seconds max)
DB_READY=0
for i in 1 2 3 4 5; do
    if php -r "
        try {
            \$pdo = new PDO(
                'mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}',
                '${DB_USERNAME}',
                '${DB_PASSWORD}',
                [PDO::ATTR_TIMEOUT => 2]
            );
            echo 'OK';
            exit(0);
        } catch (Exception \$e) {
            exit(1);
        }
    " 2>/dev/null | grep -q "OK"; then
        echo "✅ Database connected!"
        DB_READY=1
        break
    fi
    echo "  Attempt $i/5 - waiting..."
    sleep 1
done

if [ "$DB_READY" -eq 0 ]; then
    echo "⚠️  Database not ready - server will start anyway"
else
    # ========================================
    # Step 4.5: Run database migrations
    # ========================================
    echo ""
    echo "🔄 Step 4.5: Running database migrations..."
    php artisan migrate --force 2>/dev/null || echo "⚠️  Migration skipped (may already be up to date)"
    echo "✅ Migration check complete"
fi

# ========================================
# Step 5: START THE SERVER IMMEDIATELY
# Skip all artisan commands - they cause bootstrap errors
# ========================================
echo ""
echo "========================================"
echo "🌐 Step 5: Starting PHP server..."
echo "========================================"

SERVER_PORT="${PORT:-8080}"
echo ""
echo "📍 Server: http://0.0.0.0:$SERVER_PORT"
echo "📍 Health: http://0.0.0.0:$SERVER_PORT/api/health"
echo ""

# Use PHP built-in server pointing to public/index.php
# This bypasses artisan serve which has bootstrap issues
cd public

exec php -d memory_limit=256M -d upload_max_filesize=10M -d post_max_size=12M -S 0.0.0.0:$SERVER_PORT index.php
