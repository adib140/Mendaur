<?php

/**
 * Script untuk reset foto produk yang tidak valid (file tidak ada)
 * Jalankan di production Railway: php reset_invalid_photos.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Produk;
use App\Models\Artikel;
use Illuminate\Support\Facades\DB;

echo "=== Reset Invalid Photos Script ===\n\n";

// Reset Produk photos that are local paths (not Cloudinary URLs)
echo "Checking Produk photos...\n";
$produks = Produk::whereNotNull('foto')
    ->where('foto', 'NOT LIKE', 'http%')
    ->get();

echo "Found {$produks->count()} produk with local storage paths\n";

foreach ($produks as $produk) {
    echo "  - Produk #{$produk->produk_id} ({$produk->nama}): {$produk->foto}\n";
    echo "    → Setting foto to NULL (file tidak ada di Railway)\n";

    $produk->foto = null;
    $produk->save();
}

// Reset Artikel photos that are local paths
echo "\nChecking Artikel photos...\n";
$artikels = Artikel::whereNotNull('foto_cover')
    ->where('foto_cover', 'NOT LIKE', 'http%')
    ->get();

echo "Found {$artikels->count()} artikel with local storage paths\n";

foreach ($artikels as $artikel) {
    echo "  - Artikel #{$artikel->artikel_id} ({$artikel->judul}): {$artikel->foto_cover}\n";
    echo "    → Setting foto_cover to NULL\n";

    $artikel->foto_cover = null;
    $artikel->save();
}

echo "\n=== Done! ===\n";
echo "Produk dan Artikel dengan foto local storage sudah di-reset.\n";
echo "Silakan upload ulang foto via admin panel.\n";
