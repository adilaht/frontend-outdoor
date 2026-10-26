/**
 * bookingService.ts
 * 
 * ⚡ Menggunakan NATIVE FETCH API — bukan Axios XMLHttpRequest.
 * 
 * Alasan: Chrome Android (terutama versi Android 10+) memiliki bug di mana 
 * XMLHttpRequest.send(FormData) dengan withCredentials=true pada cross-origin 
 * request sering kali hang/freeze setelah CORS preflight berhasil, sehingga 
 * POST tidak pernah terkirim ke server. Native fetch API tidak memiliki bug ini.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const CHECKOUT_TIMEOUT_MS = 60_000; // 60 detik — lebih longgar untuk koneksi seluler lambat

export async function submitCheckoutStep1(
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  // Ambil session ID & admin token dari localStorage
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') || '' : '';
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';

  // Headers — JANGAN set Content-Type karena browser perlu generate boundary multipart sendiri
  const headers: Record<string, string> = {};
  if (sessionId) headers['x-session-id'] = sessionId;
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

  // AbortController untuk timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS);

  try {
    // 🔥 Progress simulasi ASIMPTOTIK — bar selalu bergerak, tidak pernah stuck.
    // Strategi: setiap interval, progress naik sebagian kecil dari sisa jarak ke 98%.
    // Makin dekat ke 98%, makin pelan geraknya → terasa natural, tidak pernah diam.
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    if (onProgress) {
      let fakePercent = 0;
      onProgress(0);
      progressInterval = setInterval(() => {
        const remaining = 98 - fakePercent;
        // Ambil 3-6% dari sisa jarak → makin kecil sisanya, makin kecil langkahnya
        const step = remaining * (0.03 + Math.random() * 0.03);
        fakePercent = Math.min(fakePercent + Math.max(step, 0.3), 98);
        onProgress(Math.round(fakePercent));
      }, 500);
    }

    const response = await fetch(`${API_BASE}/api/booking/checkout`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
      // KUNCI: credentials 'include' agar cookie & auth dikirim, 
      // tapi native fetch jauh lebih andal dari XHR untuk kasus ini
      credentials: 'include',
    });

    // Hentikan progress simulasi
    if (progressInterval) clearInterval(progressInterval);
    if (onProgress) onProgress(100);

    // Parse response body
    const contentType = response.headers.get('content-type') || '';
    let data: any;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try { data = JSON.parse(text); } catch { data = { error: text }; }
    }

    // Handle HTTP error status
    if (!response.ok) {
      if (response.status === 413) {
        throw {
          error: "Ukuran berkas identitas terlalu besar untuk diterima oleh server (Batas upload terlampaui).",
          isPayloadTooLarge: true,
        };
      }
      throw {
        error: data?.error || data?.message || `Server merespons dengan status ${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    console.error("Gagal submit checkout step 1:", error);

    // Timeout via AbortController
    if (error?.name === 'AbortError') {
      throw {
        error: "Koneksi ke server timeout (60 detik). Pastikan jaringan internet stabil dan coba lagi.",
        isTimeout: true,
      };
    }

    // Network failure (DNS, offline, CORS block)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw {
        error: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
        isNetworkError: true,
      };
    }

    // Re-throw jika sudah dalam format yang kita buat
    if (error?.isTimeout || error?.isPayloadTooLarge || error?.isNetworkError) {
      throw error;
    }

    // Error lainnya
    throw {
      error: error?.error || error?.message || "Terjadi kesalahan jaringan saat mendaftarkan sewa.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}