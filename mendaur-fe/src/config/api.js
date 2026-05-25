// API Configuration
const rawUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const baseUrl = rawUrl && !rawUrl.startsWith('http') ? `https://${rawUrl}` : rawUrl;
const PRODUCTION_URL = 'https://bsusedulurmendaur.my.id/api';
const PRODUCTION_STORAGE_URL = 'https://bsusedulurmendaur.my.id';

// API_BASE_URL should include /api suffix
// For local dev: VITE_API_URL=http://127.0.0.1:8000/api
// For production: defaults to https://bsusedulurmendaur.my.id/api
export const API_BASE_URL = baseUrl || PRODUCTION_URL;
export const STORAGE_URL = baseUrl ? baseUrl.replace('/api', '') : PRODUCTION_STORAGE_URL;

// Get full URL for stored files
export const getStorageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const cleanPath = path.replace(/^\/+/, '');
  
  if (cleanPath.startsWith('uploads/') || cleanPath.startsWith('storage/')) {
    return `${STORAGE_URL}/${cleanPath}`;
  }
  
  if (cleanPath.startsWith('avatars/')) {
    return `${STORAGE_URL}/storage/${cleanPath}`;
  }
  
  return `${STORAGE_URL}/storage/${cleanPath}`;
};
