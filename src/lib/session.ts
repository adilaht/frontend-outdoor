// src/lib/session.ts

/**
 * Mendapatkan atau membuat session_id unik untuk customer.
 * Disimpan di LocalStorage agar keranjang belanja tidak hilang saat halaman di-refresh.
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''; // Jalur aman penangkal error SSR Next.js

  let sessionId = localStorage.getItem('session_id');

  if (!sessionId) {
    // Generate UUID v4 standar industri menggunakan Web Crypto API bawaan browser
    sessionId = crypto.randomUUID();
    localStorage.setItem('session_id', sessionId);
  }

  return sessionId;
}