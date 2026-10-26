import axios from 'axios';

export const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 detik batas waktu agar UI tidak muter selamanya jika jaringan terputus
  withCredentials: true
  // headers: { 'Content-Type': 'application/json' }
});

// Interceptor untuk mengirim Token Admin jika ada
apiInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor untuk menangani Unauthorized (Token Kadaluarsa)
apiInstance.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && typeof window !== 'undefined') {
    // Jika berada di area admin, paksa logout
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
  }
  return Promise.reject(error);
});