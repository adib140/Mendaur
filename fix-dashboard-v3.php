<?php
/**
 * Script untuk fix DashboardController - line 48 error
 * Upload ke /public_html/api/ dan jalankan via browser
 */

$controllerPath = '/home/bsusedul/mendaur-api/app/Http/Controllers/DashboardController.php';

if (!file_exists($controllerPath)) {
    die("❌ DashboardController.php not found at: $controllerPath");
}

$content = file_get_contents($controllerPath);

// Backup
$backupPath = $controllerPath . '.backup.' . date('YmdHis');
copy($controllerPath, $backupPath);
echo "Backup created: $backupPath<br><br>";

// Show lines 45-55 for debugging
echo "<h3>Current code (lines 45-60):</h3>";
$lines = explode("\n", $content);
echo "<pre>";
for ($i = 44; $i < min(60, count($lines)); $i++) {
    echo ($i+1) . ": " . htmlspecialchars($lines[$i]) . "\n";
}
echo "</pre><br>";

// The issue is that $levelThresholds uses string keys but level might still not match
// Let's check if there's array access issue

// Find and fix: ensure default value when accessing levelThresholds
$oldCode = '$currentLevelPoin = $levelThresholds[$currentLevel][\'min\'];';
$newCode = '$currentLevelPoin = $levelThresholds[$currentLevel][\'min\'] ?? 0;';

if (strpos($content, $newCode) !== false) {
    echo "<h2 style='color: blue;'>ℹ️ Fix already applied (null coalescing on currentLevelPoin)</h2>";
} elseif (strpos($content, $oldCode) !== false) {
    $content = str_replace($oldCode, $newCode, $content);

    if (file_put_contents($controllerPath, $content)) {
        echo "<h2 style='color: green;'>✅ Fixed currentLevelPoin!</h2>";
    } else {
        echo "<h2 style='color: red;'>❌ Failed to write file</h2>";
    }
} else {
    echo "<p>currentLevelPoin line not found exactly as expected</p>";
}

// Also add safe check for levelThresholds access
$oldCode2 = "if (!isset(\$levelThresholds[\$currentLevel])) {";
if (strpos($content, $oldCode2) === false) {
    // Need to add safety check
    $searchPattern = '$nextLevel = ucfirst(strtolower($nextLevel));
        $nextLevelPoin = $levelThresholds[$nextLevel][\'min\'] ?? $currentPoin;
        $currentLevelPoin = $levelThresholds[$currentLevel][\'min\']';

    $replacePattern = '// Ensure currentLevel exists in thresholds, default to Pemula
        if (!isset($levelThresholds[$currentLevel])) {
            $currentLevel = \'Pemula\';
        }

        $nextLevel = ucfirst(strtolower($nextLevel));

        // Ensure nextLevel exists in thresholds
        if (!isset($levelThresholds[$nextLevel])) {
            $nextLevel = \'Pemula\';
        }

        $nextLevelPoin = $levelThresholds[$nextLevel][\'min\'] ?? $currentPoin;
        $currentLevelPoin = $levelThresholds[$currentLevel][\'min\']';

    if (strpos($content, $searchPattern) !== false) {
        $content = str_replace($searchPattern, $replacePattern, $content);
        if (file_put_contents($controllerPath, $content)) {
            echo "<h2 style='color: green;'>✅ Added safety checks for level thresholds!</h2>";
        }
    } else {
        echo "<p>Could not find pattern to add safety checks. Manual fix needed.</p>";

        // Show entire getUserStats method
        echo "<h3>Full getUserStats method:</h3><pre>";
        if (preg_match('/public function getUserStats[\s\S]*?^    \}/m', $content, $matches)) {
            echo htmlspecialchars($matches[0]);
        }
        echo "</pre>";
    }
}

// Clear cache
echo "<br><p>Clearing cache...</p>";
$cachePath = '/home/bsusedul/mendaur-api/bootstrap/cache/';
$files = glob($cachePath . '*.php');
foreach ($files as $file) {
    @unlink($file);
}
echo "<p>Cache cleared.</p>";

echo "<br><strong>⚠️ DELETE THIS FILE AFTER USE!</strong>";
