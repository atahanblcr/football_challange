// src/hooks/use-auth.ts
import { create } from 'zustand';
import { api } from '@/config/api';

interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'editor' | 'moderator';
}

interface AuthStore {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

// Zustand store — auth state için TanStack Query değil
export const useAuth = create<AuthStore>((set) => ({
  admin: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await api.post('/admin/auth/login', { email, password });
    const { sessionToken, admin } = res.data.data;
    localStorage.setItem('admin_session', sessionToken);
    set({ admin });
  },

  logout: async () => {
    await api.post('/admin/auth/logout').catch(() => {});
    localStorage.removeItem('admin_session');
    set({ admin: null });
    window.location.href = '/login';
  },

  checkSession: async () => {
    try {
      const res = await api.get('/admin/auth/me');
      set({ admin: res.data.data, isLoading: false });
    } catch {
      set({ admin: null, isLoading: false });
    }
  },
}));
