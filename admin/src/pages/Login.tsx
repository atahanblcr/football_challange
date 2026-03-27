// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, admin } = useAuth();
  const navigate = useNavigate();

  // Zaten giriş yapılmışsa dashboard'a yönlendir
  if (admin) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success('Giriş başarılı');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.error?.message ?? 'Giriş başarısız';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl mb-2 block">⚽</span>
          <h1 className="text-2xl font-bold text-white">Football Challenge</h1>
          <p className="text-slate-400">Admin Paneli</p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="bg-surface p-8 rounded-2xl border border-surface-variant shadow-xl space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              E-posta
            </label>
            <input
              type="email"
              required
              className="w-full bg-background border border-surface-variant rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
              placeholder="admin@footballchallenge.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
              Şifre
            </label>
            <input
              type="password"
              required
              className="w-full bg-background border border-surface-variant rounded-lg px-4 py-2.5 text-white outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-primary/20"
          >
            {isSubmitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-slate-500 text-xs">
          © 2026 Football Challenge · Tüm Hakları Saklıdır
        </p>
      </div>
    </div>
  );
}
