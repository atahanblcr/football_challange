// src/config/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  /* @ts-ignore */
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api',
  withCredentials: true, // Session cookie için
});

// İstek interceptor — admin session token header'a ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_session');
  if (token) {
    config.headers['x-admin-session'] = token;
  }
  return config;
});

// Yanıt interceptor — hata yönetimi
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message ?? 'Beklenmedik bir hata oluştu';

    if (status === 401) {
      localStorage.removeItem('admin_session');
      // Redirect handled by useAuth or ProtectedRoute to avoid reload loops
      // but if we want instant redirect:
      // window.location.href = '/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      toast.error('Bu işlem için yetkiniz yok');
    } else if (status === 429) {
      toast.error('Çok fazla istek gönderildi. Lütfen bekleyin.');
    } else if (status >= 500) {
      toast.error('Sunucu hatası: ' + message);
    }

    return Promise.reject(error);
  }
);
