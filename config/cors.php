<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://bsusedulurmendaur.my.id',                    // Dewaweb Production
        'https://www.bsusedulurmendaur.my.id',                // Dewaweb www subdomain
        'https://mendaur.up.railway.app',                    // Backend Production (legacy)
        'https://sedulurmendaur-production.up.railway.app',  // Frontend Production (legacy)
        'http://localhost:5173',                              // Local Vite dev
        'http://127.0.0.1:5173',                              // Local IP Vite dev
        'http://localhost:8000',                              // Alternative local
        'http://127.0.0.1:8000',                              // Alternative local IP
        'http://localhost:3000',                              // Local React dev
        'http://127.0.0.1:3000',                              // Local React IP
    ],

    'allowed_origins_patterns' => [
        '#^https://.*\.railway\.app$#',  // Allow all Railway subdomains
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['X-Request-Id'],

    'max_age' => 86400,  // Cache preflight for 24 hours

    'supports_credentials' => true,

];
