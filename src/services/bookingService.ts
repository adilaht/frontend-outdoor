import { apiInstance } from '@/src/lib/axios';

export async function submitCheckoutStep1(
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<any> {
  try {
    // Header wajib menggunakan multipart/form-data untuk upload file
    const response = await apiInstance.post('/api/booking/checkout', formData, {
      headers: {
        // Sertakan session_id lewat header jika backend memerlukannya untuk tracking cart
        'x-session-id': localStorage.getItem('session_id') || '', 
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Gagal submit checkout step 1:", error);
    if (error?.response?.data) {
      throw error.response.data;
    }
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      throw {
        error: "Koneksi ke server timeout. Pengunggahan berkas membutuhkan waktu terlalu lama atau koneksi seluler terputus. Silakan coba lagi.",
        isTimeout: true,
      };
    }
    if (error?.response?.status === 413) {
      throw {
        error: "Ukuran berkas identitas terlalu besar untuk diterima oleh server (Batas upload terlampaui).",
        isPayloadTooLarge: true,
      };
    }
    throw {
      error: error?.message || "Terjadi kesalahan jaringan saat mendaftarkan sewa.",
    };
  }
}