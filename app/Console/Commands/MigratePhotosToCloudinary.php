<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Produk;
use App\Models\Artikel;
use App\Models\TabungSampah;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Support\Facades\Storage;

class MigratePhotosToCloudinary extends Command
{
    protected $signature = 'photos:migrate-to-cloudinary {--model=all : Model to migrate (produk, artikel, tabung_sampah, user, all)}';
    protected $description = 'Migrate existing local photos to Cloudinary';

    public function handle()
    {
        $model = $this->option('model');
        $cloudinaryService = new CloudinaryService();

        $this->info('Starting photo migration to Cloudinary...');

        if ($model === 'all' || $model === 'produk') {
            $this->migrateProdukPhotos($cloudinaryService);
        }

        if ($model === 'all' || $model === 'artikel') {
            $this->migrateArtikelPhotos($cloudinaryService);
        }

        if ($model === 'all' || $model === 'tabung_sampah') {
            $this->migrateTabungSampahPhotos($cloudinaryService);
        }

        if ($model === 'all' || $model === 'user') {
            $this->migrateUserPhotos($cloudinaryService);
        }

        $this->info('Migration completed!');
    }

    private function migrateProdukPhotos(CloudinaryService $cloudinaryService)
    {
        $this->info('Migrating Produk photos...');

        $produks = Produk::whereNotNull('foto')
            ->where('foto', 'NOT LIKE', 'http%')
            ->get();

        $this->info("Found {$produks->count()} produk with local photos");

        foreach ($produks as $produk) {
            $this->migratePhoto($produk, 'foto', 'foto_public_id', 'produk', $cloudinaryService);
        }
    }

    private function migrateArtikelPhotos(CloudinaryService $cloudinaryService)
    {
        $this->info('Migrating Artikel photos...');

        $artikels = Artikel::whereNotNull('foto_cover')
            ->where('foto_cover', 'NOT LIKE', 'http%')
            ->get();

        $this->info("Found {$artikels->count()} artikel with local photos");

        foreach ($artikels as $artikel) {
            $this->migratePhoto($artikel, 'foto_cover', 'foto_cover_public_id', 'artikel', $cloudinaryService);
        }
    }

    private function migrateTabungSampahPhotos(CloudinaryService $cloudinaryService)
    {
        $this->info('Migrating TabungSampah photos...');

        $tabungSampahs = TabungSampah::whereNotNull('foto_sampah')
            ->where('foto_sampah', 'NOT LIKE', 'http%')
            ->get();

        $this->info("Found {$tabungSampahs->count()} tabung sampah with local photos");

        foreach ($tabungSampahs as $tabungSampah) {
            $this->migratePhoto($tabungSampah, 'foto_sampah', 'foto_sampah_public_id', 'sampah', $cloudinaryService);
        }
    }

    private function migrateUserPhotos(CloudinaryService $cloudinaryService)
    {
        $this->info('Migrating User photos...');

        $users = User::whereNotNull('foto_profil')
            ->where('foto_profil', 'NOT LIKE', 'http%')
            ->get();

        $this->info("Found {$users->count()} users with local photos");

        foreach ($users as $user) {
            $this->migratePhoto($user, 'foto_profil', 'foto_profil_public_id', 'profiles', $cloudinaryService);
        }
    }

    private function migratePhoto($model, $photoField, $publicIdField, $folder, CloudinaryService $cloudinaryService)
    {
        $localPath = $model->$photoField;

        // Skip if already Cloudinary URL
        if (str_starts_with($localPath, 'http')) {
            return;
        }

        $fullPath = storage_path('app/public/' . $localPath);

        if (!file_exists($fullPath)) {
            $this->warn("File not found: {$localPath} - Setting to null for {$model->getTable()} ID: {$model->getKey()}");

            // Set photo to null since file doesn't exist
            $model->$photoField = null;
            $model->save();
            return;
        }

        $this->info("Uploading: {$localPath}");

        try {
            // Create a temporary UploadedFile from existing file
            $file = new \Illuminate\Http\UploadedFile(
                $fullPath,
                basename($localPath),
                mime_content_type($fullPath),
                null,
                true
            );

            $result = $cloudinaryService->uploadImage($file, $folder);

            if ($result['success']) {
                $model->$photoField = $result['url'];
                if ($publicIdField) {
                    $model->$publicIdField = $result['public_id'];
                }
                $model->save();

                $this->info("✓ Migrated: {$localPath} -> {$result['url']}");
            } else {
                $this->error("✗ Failed to upload: {$localPath}");
            }
        } catch (\Exception $e) {
            $this->error("✗ Error migrating {$localPath}: {$e->getMessage()}");
        }
    }
}
