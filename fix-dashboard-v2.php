<?php
/**
 * Script untuk fix DashboardController - level handling
 * Upload ke /public_html/api/ dan jalankan via browser
 */

$controllerPath = '/home/bsusedul/mendaur-api/app/Http/Controllers/DashboardController.php';

if (!file_exists($controllerPath)) {
    die("❌ DashboardController.php not found at: $controllerPath");
}

$content = file_get_contents($controllerPath);

// Show current content around level handling
echo "<h3>Current code around level handling:</h3>";
echo "<pre>";
if (preg_match('/\$currentLevel = \$user->level;[\s\S]{0,200}/', $content, $m)) {
    echo htmlspecialchars($m[0]);
}
echo "</pre><br>";

// Backup
$backupPath = $controllerPath . '.backup.' . date('YmdHis');
copy($controllerPath, $backupPath);
echo "Backup created: $backupPath<br><br>";

// Find and fix: add level mapping before the ucfirst line
$search = '$currentLevel = $user->level;
        // Normalize level to PascalCase (bronze → Bronze, silver → Silver, etc.)
        $currentLevel = ucfirst(strtolower($currentLevel));';

$replace = '$currentLevel = $user->level;

        // Handle numeric level (1,2,3) to string level mapping
        $levelMapping = [
            1 => \'Pemula\',
            \'1\' => \'Pemula\',
            2 => \'Bronze\',
            \'2\' => \'Bronze\',
            3 => \'Silver\',
            \'3\' => \'Silver\',
            4 => \'Gold\',
            \'4\' => \'Gold\',
            5 => \'Platinum\',
            \'5\' => \'Platinum\',
        ];

        // If level is numeric, convert to string
        if (isset($levelMapping[$currentLevel])) {
            $currentLevel = $levelMapping[$currentLevel];
        }

        // Normalize level to PascalCase (bronze → Bronze, silver → Silver, etc.)
        $currentLevel = ucfirst(strtolower($currentLevel));';

if (strpos($content, 'levelMapping') !== false) {
    echo "<h2 style='color: blue;'>ℹ️ DashboardController already has levelMapping fix</h2>";
} elseif (strpos($content, $search) !== false) {
    $content = str_replace($search, $replace, $content);

    if (file_put_contents($controllerPath, $content)) {
        echo "<h2 style='color: green;'>✅ DashboardController.php fixed!</h2>";
        echo "<p>Added numeric level to string mapping.</p>";
    } else {
        echo "<h2 style='color: red;'>❌ Failed to write file</h2>";
    }
} else {
    echo "<h2 style='color: orange;'>⚠️ Could not find the exact code to replace</h2>";
    echo "<p>Search string not found. Showing file content for debugging...</p>";

    // Show around line 38-45
    $lines = explode("\n", $content);
    echo "<pre>";
    for ($i = 35; $i < min(50, count($lines)); $i++) {
        echo ($i+1) . ": " . htmlspecialchars($lines[$i]) . "\n";
    }
    echo "</pre>";
}

echo "<br><strong>⚠️ DELETE THIS FILE AFTER USE!</strong>";
