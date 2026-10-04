import { apiInstance } from '@/src/lib/axios'; // Sesuaikan dengan path instance axios lu

// Fungsi pembantu untuk mengambil session_id dari localStorage
const getSessionHeader = () => ({
  'x-session-id': typeof window !== 'undefined' ? localStorage.getItem('session_id') || '' : '',
});

export async function verifyOTP(email: string, otp: string): Promise<any> {
  try {
    const response = await apiInstance.post(
      '/api/booking/verify', 
      { email, kode_otp: otp },
      {
        headers: getSessionHeader(),
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Gagal verifikasi OTP:", error);
    throw error?.response?.data || new Error("Terjadi kesalahan sistem");
  }
}

export async function resendOTP(email: string): Promise<any> {
  try {
    const response = await apiInstance.post(
      '/api/booking/resend-otp', 
      { email },
      {
        headers: getSessionHeader(),
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Gagal mengirim ulang OTP:", error);
    throw error?.response?.data || new Error("Terjadi kesalahan sistem");
  }
}