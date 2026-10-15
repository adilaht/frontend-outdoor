// src/lib/imageHelper.ts
// Helper terpusat untuk menormalisasi URL gambar produk dari backend.
// Backend bisa mengirim images sebagai string[] atau { id_image, url }[].
// Fungsi ini memastikan output selalu berupa string URL siap pakai.

/**
 * Mengekstrak URL dari satu item image.
 * Menangani baik string langsung maupun objek { url: string }.
 */
export function extractImageUrl(img: unknown): string {
  let url = '';
  if (typeof img === 'string') url = img;
  else if (img && typeof img === 'object' && 'url' in img) url = (img as { url: string }).url;
  
  if (!url) return '';
  
  // Jika URL berupa path relatif dari backend (seperti yang dikirim cartModel tanpa buildImageUrl)
  if (url.startsWith('/uploads')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Hapus trailing slash dari baseUrl kalau ada, untuk mencegah double slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${url}`;
  }
  
  return url;
}

/**
 * Menormalisasi array images dari respons backend menjadi string[].
 */
export function normalizeImages(images: unknown[] | undefined | null): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.map(extractImageUrl).filter(Boolean);
}

/**
 * Mengambil cover image pertama dari array images, dengan fallback.
 */
export function getCoverImage(images: unknown[] | undefined | null, fallback?: string): string {
  const normalized = normalizeImages(images);
  return normalized.length > 0
    ? normalized[0]
    : (fallback || '/background_splash.jpg');
}
