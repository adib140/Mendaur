<?php
/**
 * Script untuk update index.php dengan CORS headers yang lengkap
 * Upload ke /public_html/api/ dan jalankan via browser
 */

$indexPath = __DIR__ . '/index.php';

$newIndexContent = <<<'PHP'
<?php

// CORS Headers - Handle all origins and headers
$allowedOrigins = [
    'https://www.bsusedulurmendaur.my.id',
    'https://bsusedulurmendaur.my.id',
    'http://www.bsusedulurmendaur.my.id',
    'http://bsusedulurmendaur.my.id',
    'http://localhost:5173',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Default untuk production
    header("Access-Control-Allow-Origin: https://www.bsusedulurmendaur.my.id");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-CSRF-TOKEN");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../mendaur-api/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../mendaur-api/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
$app = require_once __DIR__.'/../mendaur-api/bootstrap/app.php';

// Get the route from query string (set by .htaccess)
$route = $_GET['route'] ?? $_SERVER['PATH_INFO'] ?? '/';

// Ensure route starts with /
if (!str_starts_with($route, '/')) {
    $route = '/' . $route;
}

// Prepend /api if not already present
if (!str_starts_with($route, '/api')) {
    $route = '/api' . $route;
}

// Build full URI with query string (excluding 'route' parameter)
$queryParams = $_GET;
unset($queryParams['route']);
$queryString = http_build_query($queryParams);
$fullUri = $route . ($queryString ? '?' . $queryString : '');

// Create request with the modified URI
$request = Request::create(
    $fullUri,
    $_SERVER['REQUEST_METHOD'],
    $_POST,
    $_COOKIE,
    $_FILES,
    $_SERVER
);

// Copy headers from original request
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $request->headers->set($name, $value);
    }
}

// Handle the request
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
PHP;

// Backup existing index.php
if (file_exists($indexPath)) {
    $backupPath = __DIR__ . '/index.php.backup.' . date('YmdHis');
    copy($indexPath, $backupPath);
    echo "Backup created: $backupPath<br>";
}

// Write new index.php
if (file_put_contents($indexPath, $newIndexContent)) {
    echo "<h2 style='color: green;'>✅ index.php updated successfully!</h2>";
    echo "<p>CORS headers now include:</p>";
    echo "<ul>";
    echo "<li>Cache-Control</li>";
    echo "<li>Pragma</li>";
    echo "<li>X-CSRF-TOKEN</li>";
    echo "<li>All standard headers</li>";
    echo "</ul>";
    echo "<p>Allowed origins:</p>";
    echo "<ul>";
    echo "<li>https://www.bsusedulurmendaur.my.id</li>";
    echo "<li>https://bsusedulurmendaur.my.id</li>";
    echo "<li>http://localhost:5173</li>";
    echo "</ul>";
    echo "<br><strong>⚠️ DELETE THIS FILE AFTER USE!</strong>";
} else {
    echo "<h2 style='color: red;'>❌ Failed to update index.php</h2>";
    echo "<p>Check file permissions.</p>";
}
