/**
 * Resolves a media URL (image, avatar, banner, document) to a full accessible URL.
 * Handles absolute URLs (http://, https://), base64 data URIs (data:image/...),
 * and relative server paths (/media/uploads/...).
 */
export const getMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const serverBase = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  
  return `${serverBase}${cleanPath}`;
};
