// src/lib/imageHelper.ts
// Helper terpusat untuk menormalisasi URL gambar produk dari backend.
// Backend bisa mengirim images sebagai string[] atau { id_image, url }[].
// Fungsi ini memastikan output selalu berupa string URL siap pakai.

/**
 * Mengekstrak URL dari satu item image.
 * Menangani baik string langsung maupun objek { url: string }.
 */
export function extractImageUrl(img: unknown): string {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object' && 'url' in img) return (img as { url: string }).url;
  return '';
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
