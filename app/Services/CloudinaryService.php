<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Cloudinary\Api\Upload\UploadApi;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class CloudinaryService
{
    private $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'api_key' => config('services.cloudinary.api_key'),
                'api_secret' => config('services.cloudinary.api_secret'),
                'secure' => true,
            ]
        ]);
    }

    public function uploadImage(UploadedFile $file, string $folder = 'uploads'): array
    {
        $publicId = Str::random(20) . '_' . time();
        $uploadFolder = config('services.cloudinary.upload_folder', 'mendaur') . '/' . $folder;

        try {
            \Log::info('Cloudinary upload attempt', [
                'folder' => $uploadFolder,
                'public_id' => $publicId,
                'cloud_name' => config('services.cloudinary.cloud_name'),
                'file_size' => $file->getSize(),
                'file_mime' => $file->getMimeType()
            ]);

            $result = $this->cloudinary->uploadApi()->upload(
                $file->getPathname(),
                [
                    'public_id' => $publicId,
                    'folder' => $uploadFolder,
                    'transformation' => [
                        'quality' => 'auto:eco',
                        'fetch_format' => 'auto'
                    ]
                ]
            );

            \Log::info('Cloudinary upload success', [
                'secure_url' => $result['secure_url'],
                'public_id' => $result['public_id']
            ]);

            return [
                'success' => true,
                'url' => $result['secure_url'],
                'public_id' => $result['public_id'],
                'width' => $result['width'],
                'height' => $result['height'],
            ];

        } catch (\Exception $e) {
            \Log::error('Cloudinary upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    public function deleteImage(string $publicId): bool
    {
        try {
            $this->cloudinary->uploadApi()->destroy($publicId);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getOptimizedUrl(string $publicId, array $transformations = []): string
    {
        $defaultTransformations = [
            'quality' => 'auto:eco',
            'fetch_format' => 'auto'
        ];

        $transformations = array_merge($defaultTransformations, $transformations);

        return $this->cloudinary->image($publicId)
                                ->addTransformation($transformations)
                                ->toUrl();
    }
}
