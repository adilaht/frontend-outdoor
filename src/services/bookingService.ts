import { apiInstance } from '@/src/lib/axios';

export async function submitCheckoutStep1(formData: FormData): Promise<any> {
  try {
    // Header wajib menggunakan multipart/form-data untuk upload file
    const response = await apiInstance.post('/api/booking/checkout', formData, {
      headers: {
        
        // Sertakan session_id lewat header jika backend memerlukannya untuk tracking cart
        'x-session-id': localStorage.getItem('session_id') || '', 
      },
    });
    return response.data;
  } catch (error: any) {
    console.error("Gagal submit checkout step 1:", error);
    throw error?.response?.data || new Error("Terjadi kesalahan sistem");
  }
}