<?php
/**
 * Clear Laravel Cache Script
 * Upload to: /home/bsusedul/public_html/api/clear-cache.php
 * Access: https://bsusedulurmendaur.my.id/api/clear-cache.php
 * DELETE AFTER USE!
 */

// Security check - only allow from specific IPs or with secret key
$secretKey = 'mendaur-clear-2026';
if (!isset($_GET['key']) || $_GET['key'] !== $secretKey) {
    http_response_code(403);
    die('Access denied. Use ?key=' . $secretKey);
}

echo "<pre style='font-family: monospace; background: #1a1a2e; color: #0f0; padding: 20px;'>";
echo "=== Laravel Cache Clear ===\n\n";

try {
    // Define Laravel base path (adjust if needed)
    $laravelPath = dirname(__DIR__, 2) . '/mendaur-api';

    if (!file_exists($laravelPath . '/artisan')) {
        // Try alternative path
        $laravelPath = '/home/bsusedul/mendaur-api';
    }

    echo "Laravel Path: $laravelPath\n\n";

    // Clear config cache
    echo "1. Clearing config cache...\n";
    $configCache = $laravelPath . '/bootstrap/cache/config.php';
    if (file_exists($configCache)) {
        unlink($configCache);
        echo "   ✓ Config cache cleared\n";
    } else {
        echo "   - No config cache found\n";
    }

    // Clear route cache
    echo "\n2. Clearing route cache...\n";
    $routeCache = $laravelPath . '/bootstrap/cache/routes-v7.php';
    if (file_exists($routeCache)) {
        unlink($routeCache);
        echo "   ✓ Route cache cleared\n";
    } else {
        echo "   - No route cache found\n";
    }

    // Clear compiled classes
    echo "\n3. Clearing compiled classes...\n";
    $compiledPath = $laravelPath . '/bootstrap/cache/compiled.php';
    if (file_exists($compiledPath)) {
        unlink($compiledPath);
        echo "   ✓ Compiled classes cleared\n";
    } else {
        echo "   - No compiled classes found\n";
    }

    // Clear view cache
    echo "\n4. Clearing view cache...\n";
    $viewCachePath = $laravelPath . '/storage/framework/views';
    if (is_dir($viewCachePath)) {
        $files = glob($viewCachePath . '/*.php');
        $count = 0;
        foreach ($files as $file) {
            unlink($file);
            $count++;
        }
        echo "   ✓ Cleared $count view cache files\n";
    }

    // Clear application cache
    echo "\n5. Clearing application cache...\n";
    $cachePath = $laravelPath . '/storage/framework/cache/data';
    if (is_dir($cachePath)) {
        $cleared = clearCacheDir($cachePath);
        echo "   ✓ Cleared $cleared cache files\n";
    } else {
        echo "   - No cache directory found\n";
    }

    // Clear sessions (optional)
    echo "\n6. Clearing old sessions...\n";
    $sessionPath = $laravelPath . '/storage/framework/sessions';
    if (is_dir($sessionPath)) {
        $files = glob($sessionPath . '/*');
        $count = 0;
        $now = time();
        foreach ($files as $file) {
            if (is_file($file) && ($now - filemtime($file)) > 7200) { // older than 2 hours
                unlink($file);
                $count++;
            }
        }
        echo "   ✓ Cleared $count old session files\n";
    }

    echo "\n=== CACHE CLEAR COMPLETE ===\n";
    echo "\n⚠️  DELETE THIS FILE AFTER USE!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

echo "</pre>";

function clearCacheDir($dir) {
    $count = 0;
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($files as $file) {
        if ($file->isFile() && $file->getFilename() !== '.gitignore') {
            unlink($file->getRealPath());
            $count++;
        }
    }
    return $count;
}
