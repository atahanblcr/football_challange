---
name: admin-panel
description: Specialized procedural guidance for admin-panel in the Football Challenge project.
---

# SKILL: ADMIN PANELİ — REACT + TANSTACK QUERY + DRAG-DROP + RBAC

> Bu skill dosyası Football Challenge admin panelinin tam implementasyonunu tanımlar.
> React + Vite + Tailwind + shadcn/ui + TanStack Query + @dnd-kit/core kullanılır.
> RBAC, soru takvimi, entity yönetimi, kullanıcı yönetimi ve dashboard
> burada tanımlanan kurallara göre implemento edilir.

---

## 1. PROJE KURULUMU

### package.json bağımlılıkları

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-query-devtools": "^5.40.0",
    "axios": "^1.7.2",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "date-fns": "^3.6.0",
    "lucide-react": "^0.395.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "react-hot-toast": "^2.4.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5",
    "vite": "^5.3.1"
  }
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173 },
});
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0F172A',
        surface: '#1E293B',
        'surface-variant': '#334155',
        primary: '#1A56DB',
        correct: '#10B981',
        wrong: '#EF4444',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

---

## 2. AXIOS İSTEMCİSİ + AUTH

```typescript
// src/config/api.ts
import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
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
      window.location.href = '/login';
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
```

```typescript
// src/config/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 dakika
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.response?.data?.error?.message ?? 'İşlem başarısız';
        console.error('Mutation error:', message);
      },
    },
  },
});
```

---

## 3. YARDIMCI FONKSİYONLAR

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind sınıflarını birleştir
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Modül etiketi
export const MODULE_LABELS: Record<string, string> = {
  players: '⚽ Oyuncular',
  clubs: '🏟️ Kulüpler',
  nationals: '🌍 Milli Takımlar',
  managers: '👔 Teknik Direktörler',
};

// Zorluk etiketi + renk
export const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy:   { label: '⭐☆☆ Kolay',  color: 'text-green-400' },
  medium: { label: '⭐⭐☆ Orta',  color: 'text-yellow-400' },
  hard:   { label: '⭐⭐⭐ Zor',  color: 'text-red-400' },
};

// Durum etiketi + renk
export const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active:    { label: 'Aktif',    color: 'bg-green-500/20 text-green-400' },
  draft:     { label: 'Taslak',   color: 'bg-gray-500/20 text-gray-400' },
  archived:  { label: 'Arşiv',   color: 'bg-orange-500/20 text-orange-400' },
  archiving: { label: 'Arşivleniyor', color: 'bg-yellow-500/20 text-yellow-400' },
  special:   { label: 'Özel',    color: 'bg-purple-500/20 text-purple-400' },
};

// Tarih formatlama
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

// Sayı formatlama
export function formatNumber(n: number): string {
  return n.toLocaleString('tr-TR');
}
```

---

## 4. AUTH HOOK + KORUNAN ROUTE

```typescript
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
```

```tsx
// src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  children: React.ReactNode;
  minRole?: 'super_admin' | 'editor' | 'moderator';
}

const ROLE_LEVEL = { super_admin: 3, editor: 2, moderator: 1 };

export function ProtectedRoute({ children, minRole = 'moderator' }: Props) {
  const { admin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;

  if (ROLE_LEVEL[admin.role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## 5. ANA LAYOUT — SIDEBAR

```tsx
// src/components/layout/AdminLayout.tsx
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, HelpCircle, Database,
  Users, Star, BarChart3, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard',    minRole: 'moderator' },
  { to: '/questions',  icon: HelpCircle,      label: 'Sorular',      minRole: 'moderator' },
  { to: '/entities',   icon: Database,        label: 'Entityler',    minRole: 'editor' },
  { to: '/users',      icon: Users,           label: 'Kullanıcılar', minRole: 'moderator' },
  { to: '/events',     icon: Star,            label: 'Etkinlikler',  minRole: 'editor' },
  { to: '/stats',      icon: BarChart3,       label: 'İstatistikler',minRole: 'moderator' },
  { to: '/settings',   icon: Settings,        label: 'Ayarlar',      minRole: 'super_admin' },
] as const;

const ROLE_LEVEL = { super_admin: 3, editor: 2, moderator: 1 };

export function AdminLayout() {
  const { admin, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter(
    (item) => ROLE_LEVEL[admin?.role ?? 'moderator'] >= ROLE_LEVEL[item.minRole]
  );

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface flex flex-col border-r border-surface-variant shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-surface-variant">
          <span className="font-bold text-lg">⚽ FC Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:bg-surface-variant hover:text-white'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Admin bilgisi + Çıkış */}
        <div className="p-4 border-t border-surface-variant">
          <p className="text-xs text-slate-400 mb-1 truncate">{admin?.email}</p>
          <span className="text-xs bg-surface-variant px-2 py-0.5 rounded text-slate-300">
            {admin?.role}
          </span>
          <button
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* İçerik */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

---

## 6. DASHBOARD SAYFASI

```tsx
// src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import { formatNumber } from '@/lib/utils';
import { AlertTriangle, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { PoolHealthWidget } from '@/components/dashboard/PoolHealthWidget';
import { ActiveQuestionsTable } from '@/components/dashboard/ActiveQuestionsTable';

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/stats/dashboard').then(r => r.data.data),
    refetchInterval: 30_000, // 30 saniyede bir yenile
  });

  if (isLoading) return <DashboardSkeleton />;

  const stats = data?.today ?? {};
  const pool = data?.poolHealth ?? [];
  const suspicious = data?.suspiciousCount ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <span className="text-sm text-slate-400">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Metrik kartları */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Aktif Kullanıcı"  value={formatNumber(stats.activeUsers ?? 0)}  />
        <StatCard icon={CheckCircle}   label="Çözülen Oturum"  value={formatNumber(stats.sessions ?? 0)}     />
        <StatCard icon={TrendingUp}    label="Tamamlama Oranı" value={`${stats.completionRate ?? 0}%`}       />
        <StatCard icon={TrendingUp}    label="Ort. Puan/Soru"  value={(stats.avgScore ?? 0).toFixed(1)}      />
      </div>

      {/* Şüpheli oturum uyarısı */}
      {suspicious > 0 && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <AlertTriangle size={20} className="text-yellow-400 shrink-0" />
          <span className="text-sm text-yellow-300">
            Bugün <strong>{suspicious}</strong> şüpheli oturum tespit edildi.
          </span>
          <a href="/users?filter=suspicious" className="ml-auto text-xs text-yellow-400 underline">
            İncele →
          </a>
        </div>
      )}

      {/* Havuz sağlığı */}
      <PoolHealthWidget data={pool} />

      {/* Bugün aktif sorular */}
      <ActiveQuestionsTable />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-variant">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
        <Icon size={14} />
        {label}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-6 w-48 bg-surface-variant rounded" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```

---

## 7. HAVUZ SAĞLIĞI WİDGET'I

```tsx
// src/components/dashboard/PoolHealthWidget.tsx
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface PoolItem {
  module: string;
  count: number;
  label: string;
}

interface Props { data: PoolItem[] }

const DANGER_THRESHOLD  = 5;
const WARNING_THRESHOLD = 7;

export function PoolHealthWidget({ data }: Props) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-variant">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">📦 Soru Havuzu Sağlığı</h2>
      <div className="space-y-2">
        {data.map((item) => {
          const isDanger  = item.count <= DANGER_THRESHOLD;
          const isWarning = item.count <= WARNING_THRESHOLD && !isDanger;

          return (
            <div key={item.module} className="flex items-center gap-3">
              <span className="text-sm w-36 text-slate-300">{item.label}</span>

              {/* Progress bar */}
              <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (item.count / 30) * 100)}%` }}
                />
              </div>

              <span className={`text-xs font-medium w-16 text-right ${
                isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {item.count} soru
              </span>

              {isDanger
                ? <AlertCircle size={16} className="text-red-400" />
                : isWarning
                ? <AlertTriangle size={16} className="text-yellow-400" />
                : <CheckCircle size={16} className="text-green-400" />
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## 8. SORU OLUŞTURMA — DRAG-DROP CEVAP LİSTESİ

```tsx
// src/components/questions/AnswerDragList.tsx
import {
  DndContext, closestCenter, KeyboardSensor,
  PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext,
  sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableAnswerRow } from './SortableAnswerRow';

export interface AnswerItem {
  id: string;        // Geçici UI ID
  entityId: string;
  entityName: string;
  countryCode?: string;
  statValue: string;
  statDisplay: string;
}

interface Props {
  answers: AnswerItem[];
  onChange: (updated: AnswerItem[]) => void;
}

export function AnswerDragList({ answers, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = answers.findIndex(a => a.id === active.id);
    const newIdx = answers.findIndex(a => a.id === over.id);
    onChange(arrayMove(answers, oldIdx, newIdx));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={answers.map(a => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {/* Başlık satırı */}
          <div className="grid grid-cols-[32px_32px_1fr_120px_120px_40px] gap-2
                          text-xs text-slate-400 px-3">
            <span />
            <span>Sıra</span>
            <span>Entity</span>
            <span>Stat Değeri</span>
            <span>Görünen Metin</span>
            <span />
          </div>

          {answers.map((answer, idx) => (
            <SortableAnswerRow
              key={answer.id}
              answer={answer}
              rank={idx + 1}
              onUpdate={(updated) => {
                const newList = [...answers];
                newList[idx] = updated;
                onChange(newList);
              }}
              onRemove={() => onChange(answers.filter(a => a.id !== answer.id))}
            />
          ))}

          {answers.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              Cevap eklenmedi. Aşağıdan entity arayın.
            </p>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

```tsx
// src/components/questions/SortableAnswerRow.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { AnswerItem } from './AnswerDragList';

interface Props {
  answer: AnswerItem;
  rank: number;
  onUpdate: (updated: AnswerItem) => void;
  onRemove: () => void;
}

export function SortableAnswerRow({ answer, rank, onUpdate, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: answer.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[32px_32px_1fr_120px_120px_40px] gap-2 items-center
                 bg-surface-variant rounded-lg px-3 py-2"
    >
      {/* Sürükleme tutacağı */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-slate-500 hover:text-slate-300"
      >
        <GripVertical size={16} />
      </button>

      {/* Rank (otomatik, sürüklemeyle değişir) */}
      <span className="text-xs text-slate-400 font-medium">{rank}</span>

      {/* Entity adı */}
      <div className="flex items-center gap-2 text-sm">
        {answer.countryCode && (
          <span>{flagEmoji(answer.countryCode)}</span>
        )}
        <span className="truncate">{answer.entityName}</span>
      </div>

      {/* Stat değeri */}
      <input
        className="bg-surface text-sm px-2 py-1 rounded border border-surface-variant
                   focus:border-primary outline-none text-white w-full"
        value={answer.statValue}
        onChange={e => onUpdate({ ...answer, statValue: e.target.value })}
        placeholder="192"
      />

      {/* Görünen metin */}
      <input
        className="bg-surface text-sm px-2 py-1 rounded border border-surface-variant
                   focus:border-primary outline-none text-white w-full"
        value={answer.statDisplay}
        onChange={e => onUpdate({ ...answer, statDisplay: e.target.value })}
        placeholder="192 asist"
      />

      {/* Sil */}
      <button
        onClick={onRemove}
        className="text-slate-500 hover:text-red-400 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function flagEmoji(code: string) {
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}
```

---

## 9. ENTITY ARAMA + INLINE EKLEME MODALİ

```tsx
// src/components/questions/EntitySearch.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { api } from '@/config/api';
import { AnswerItem } from './AnswerDragList';
import toast from 'react-hot-toast';

interface Props {
  module: string;
  onSelect: (item: AnswerItem) => void;
}

export function EntitySearch({ module, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['entity-search', query, module],
    queryFn: () =>
      api.get('/admin/entities/search', { params: { q: query, type: module } })
         .then(r => r.data.data),
    enabled: query.length >= 2,
  });

  function handleSelect(entity: any) {
    onSelect({
      id: crypto.randomUUID(),
      entityId: entity.id,
      entityName: entity.name,
      countryCode: entity.countryCode,
      statValue: '',
      statDisplay: '',
    });
    setQuery('');
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full bg-surface border border-surface-variant rounded-lg
                       pl-9 pr-4 py-2 text-sm text-white outline-none
                       focus:border-primary"
            placeholder="Entity ara ve ekle..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-surface-variant hover:bg-surface
                     text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus size={14} />
          Yeni Entity
        </button>
      </div>

      {/* Arama sonuçları dropdown */}
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface
                        border border-surface-variant rounded-lg z-10 shadow-xl overflow-hidden">
          {isFetching ? (
            <p className="text-sm text-slate-400 p-3">Aranıyor...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-slate-400 p-3">Sonuç bulunamadı</p>
          ) : (
            <ul>
              {results.slice(0, 8).map((entity: any) => (
                <li
                  key={entity.id}
                  onClick={() => handleSelect(entity)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-variant
                             cursor-pointer text-sm transition-colors"
                >
                  {entity.countryCode && (
                    <span>{flagEmoji(entity.countryCode)}</span>
                  )}
                  <span className="font-medium">{entity.name}</span>
                  {entity.alias?.length > 0 && (
                    <span className="text-slate-400 text-xs">
                      ({entity.alias.slice(0, 2).join(', ')})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Inline entity oluşturma modalı */}
      {showModal && (
        <QuickEntityModal
          defaultType={module}
          onClose={() => setShowModal(false)}
          onCreated={(entity) => {
            handleSelect(entity);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function QuickEntityModal({ defaultType, onClose, onCreated }: {
  defaultType: string;
  onClose: () => void;
  onCreated: (entity: any) => void;
}) {
  const [form, setForm] = useState({
    name: '', type: defaultType, countryCode: '', alias: '',
  });
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const qc = useQueryClient();

  // Çift kayıt kontrolü
  const { data: dupeCheck } = useQuery({
    queryKey: ['entity-dupe-check', form.name],
    queryFn: () =>
      api.get('/admin/entities/check-duplicate', { params: { name: form.name } })
         .then(r => r.data.data),
    enabled: form.name.length >= 3,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/admin/entities', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity oluşturuldu');
      onCreated(res.data.data);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-surface-variant">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Hızlı Entity Ekle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tip</label>
            <select
              className="w-full bg-background border border-surface-variant rounded-lg
                         px-3 py-2 text-sm text-white"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
            >
              <option value="players">⚽ Oyuncu</option>
              <option value="clubs">🏟️ Kulüp</option>
              <option value="nationals">🌍 Milli Takım</option>
              <option value="managers">👔 Teknik Direktör</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Ad</label>
            <input
              className="w-full bg-background border border-surface-variant rounded-lg
                         px-3 py-2 text-sm text-white focus:border-primary outline-none"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Lionel Messi"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Ülke Kodu</label>
            <input
              className="w-full bg-background border border-surface-variant rounded-lg
                         px-3 py-2 text-sm text-white focus:border-primary outline-none"
              value={form.countryCode}
              onChange={e => setForm({ ...form, countryCode: e.target.value.toUpperCase() })}
              placeholder="AR"
              maxLength={2}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">
              Alias (virgülle ayır)
            </label>
            <input
              className="w-full bg-background border border-surface-variant rounded-lg
                         px-3 py-2 text-sm text-white focus:border-primary outline-none"
              value={form.alias}
              onChange={e => setForm({ ...form, alias: e.target.value })}
              placeholder="Messi, Leo, La Pulga"
            />
          </div>

          {/* Çift kayıt uyarısı */}
          {dupeCheck?.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-300">
                ⚠️ Benzer kayıtlar bulundu:
              </p>
              {dupeCheck.map((d: any) => (
                <p key={d.id} className="text-xs text-yellow-200 mt-1">
                  • {d.name} ({d.type})
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-surface-variant hover:bg-surface rounded-lg py-2
                       text-sm transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.name || createMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 rounded-lg py-2
                       text-sm font-medium transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Oluşturuluyor...' : 'Entity\'yi Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}

function flagEmoji(code: string) {
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}
```

---

## 10. KULLANICI YÖNETİMİ + BAN AKIŞI

```tsx
// src/pages/users/UserList.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import { useAuth } from '@/hooks/use-auth';
import { formatDate, formatNumber } from '@/lib/utils';
import { Eye, Hammer, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export function UserList() {
  const { admin } = useAuth();
  const [search, setSearch] = useState('');
  const [filterSuspicious, setFilterSuspicious] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, filterSuspicious],
    queryFn: () =>
      api.get('/admin/users', {
        params: { search, suspicious: filterSuspicious || undefined },
      }).then(r => r.data.data),
  });

  // Ban öner (moderator)
  const suggestBanMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/admin/users/${userId}/ban-suggest`),
    onSuccess: () => {
      toast.success('Ban önerisi gönderildi');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Ban uygula (super_admin)
  const banMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/admin/users/${userId}/ban`),
    onSuccess: () => {
      toast.success('Kullanıcı banlandı');
      qc.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(null);
    },
  });

  // Ban kaldır (super_admin)
  const unbanMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/admin/users/${userId}/unban`),
    onSuccess: () => {
      toast.success('Ban kaldırıldı');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">Kullanıcı Yönetimi</h1>

      {/* Filtreler */}
      <div className="flex gap-3 mb-4">
        <input
          className="bg-surface border border-surface-variant rounded-lg
                     px-4 py-2 text-sm text-white outline-none focus:border-primary flex-1"
          placeholder="Nickname veya e-posta ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          onClick={() => setFilterSuspicious(!filterSuspicious)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
            filterSuspicious
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-surface border border-surface-variant text-slate-400'
          }`}
        >
          <AlertTriangle size={14} />
          Şüpheli
        </button>
      </div>

      {/* Tablo */}
      <div className="bg-surface rounded-xl border border-surface-variant overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-variant">
            <tr className="text-left text-xs text-slate-400">
              <th className="px-4 py-3">Nickname</th>
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Puan</th>
              <th className="px-4 py-3">Ülke</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {(data?.items ?? []).map((user: any) => (
              <tr key={user.id} className="hover:bg-surface-variant/50 transition-colors">
                <td className="px-4 py-3 flex items-center gap-2">
                  {user.flagSuspicious && (
                    <AlertTriangle size={14} className="text-yellow-400" />
                  )}
                  <span className="font-medium">{user.nickname}</span>
                </td>
                <td className="px-4 py-3 text-slate-400">{user.email}</td>
                <td className="px-4 py-3">{formatNumber(user.totalScore)}</td>
                <td className="px-4 py-3">{user.countryCode ?? '—'}</td>
                <td className="px-4 py-3">
                  {user.isBanned ? (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                      Banlı
                    </span>
                  ) : user.banSuggested ? (
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                      Ban Önerildi
                    </span>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Moderator: Ban öner */}
                    {admin?.role === 'moderator' && !user.isBanned && (
                      <button
                        onClick={() => suggestBanMutation.mutate(user.id)}
                        className="text-slate-400 hover:text-yellow-400 transition-colors"
                        title="Ban Öner"
                      >
                        <Hammer size={16} />
                      </button>
                    )}

                    {/* Super admin: Ban uygula / kaldır */}
                    {admin?.role === 'super_admin' && (
                      <button
                        onClick={() =>
                          user.isBanned
                            ? unbanMutation.mutate(user.id)
                            : banMutation.mutate(user.id)
                        }
                        className={`transition-colors ${
                          user.isBanned
                            ? 'text-green-400 hover:text-green-300'
                            : 'text-red-400 hover:text-red-300'
                        }`}
                        title={user.isBanned ? 'Banı Kaldır' : 'Banla'}
                      >
                        <Hammer size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kullanıcı detay modalı */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { data: detail } = useQuery({
    queryKey: ['user-detail', user.id],
    queryFn: () => api.get(`/admin/users/${user.id}`).then(r => r.data.data),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
      <div className="bg-surface rounded-t-2xl sm:rounded-xl p-6 w-full sm:max-w-lg
                      border border-surface-variant">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Kullanıcı: {user.nickname}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-2 text-sm text-slate-300 mb-4">
          <p><span className="text-slate-400">E-posta:</span> {user.email}</p>
          <p><span className="text-slate-400">Kayıt:</span> {formatDate(user.createdAt)}</p>
          <p><span className="text-slate-400">Toplam Puan:</span> {formatNumber(user.totalScore)}</p>
          <p><span className="text-slate-400">Premium:</span> {user.subscriptionTier}</p>
        </div>

        {/* Şüpheli oturumlar */}
        {detail?.suspiciousSessions?.length > 0 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Şüpheli Oturumlar:</p>
            <div className="space-y-1">
              {detail.suspiciousSessions.map((s: any) => (
                <div key={s.id}
                  className="bg-background rounded-lg px-3 py-2 text-xs text-slate-300">
                  {formatDate(s.submittedAt)} — {s.suspiciousReason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 11. TANSTACK QUERY HOOK KALIPLARI

```typescript
// src/hooks/use-questions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import toast from 'react-hot-toast';

// Liste
export function useQuestions(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: () =>
      api.get('/admin/questions', { params: filters }).then(r => r.data.data),
  });
}

// Tek kayıt
export function useQuestion(id: string) {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () =>
      api.get(`/admin/questions/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

// Oluştur
export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/admin/questions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Soru oluşturuldu');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Hata oluştu');
    },
  });
}

// Güncelle
export function useUpdateQuestion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/admin/questions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['question', id] });
      toast.success('Soru güncellendi');
    },
  });
}

// Arşivle (soft)
export function useArchiveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/questions/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Soru arşivleniyor...');
    },
  });
}
```

---

## 12. APP.TSX — ROUTER KURULUMU

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from '@/config/query-client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { QuestionList } from '@/pages/questions/QuestionList';
import { QuestionCreate } from '@/pages/questions/QuestionCreate';
import { QuestionEdit } from '@/pages/questions/QuestionEdit';
import { QuestionCalendar } from '@/pages/questions/QuestionCalendar';
import { EntityList } from '@/pages/entities/EntityList';
import { UserList } from '@/pages/users/UserList';
import { EventList } from '@/pages/events/EventList';
import { StatsPage } from '@/pages/stats/StatsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Sorular */}
            <Route path="questions" element={<QuestionList />} />
            <Route path="questions/create" element={
              <ProtectedRoute minRole="editor"><QuestionCreate /></ProtectedRoute>
            } />
            <Route path="questions/:id/edit" element={
              <ProtectedRoute minRole="editor"><QuestionEdit /></ProtectedRoute>
            } />
            <Route path="questions/calendar" element={<QuestionCalendar />} />

            {/* Entityler */}
            <Route path="entities" element={
              <ProtectedRoute minRole="editor"><EntityList /></ProtectedRoute>
            } />

            {/* Kullanıcılar */}
            <Route path="users" element={<UserList />} />

            {/* Etkinlikler */}
            <Route path="events" element={
              <ProtectedRoute minRole="editor"><EventList /></ProtectedRoute>
            } />

            {/* İstatistikler */}
            <Route path="stats" element={<StatsPage />} />

            {/* Ayarlar */}
            <Route path="settings" element={
              <ProtectedRoute minRole="super_admin"><SettingsPage /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
          },
        }}
      />

      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

---

## 13. KESİNLİKLE YAPILMAYACAKLAR

- Drag-drop cevap listesinde rank, sıralamayla otomatik belirlenir — elle rank girilmez.
- `stat_display` boş bırakılabilir. Admin uyarısı gösterilir ama zorunlu değildir.
- Arşivleme anında yapılmaz — aktif oturum varsa `status='archiving'` olur, 10 dakika sonra gerçek arşive geçer. Bu backend tarafından yönetilir.
- Ban akışı: moderator sadece önerir, super_admin onaylar. Moderator doğrudan ban uygulayamaz.
- Soru kopyalama özelliği yoktur.
- TanStack Query yerine `useEffect + fetch` kullanılmaz.
- `console.log` production build'e girmez.
- API çağrıları component içinde doğrudan yapılmaz — her zaman hook'lar aracılığıyla.
- Silme işlemleri confirm dialog olmadan gerçekleştirilmez.
