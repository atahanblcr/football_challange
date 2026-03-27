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
