import { useState } from 'react';
import { useUsers, useBanUser, useUnbanUser } from '@/hooks/use-users';
import { Search, ShieldAlert, ShieldCheck, User, MapPin, Calendar, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function UserList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    isBanned: '',
  });

  const { data, isLoading } = useUsers(filters);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const handleBan = (id: string) => {
    const reason = window.prompt('Ban sebebi girin:');
    if (reason) banMutation.mutate({ id, reason });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Kullanıcılar</h1>
        <p className="text-sm text-slate-500 mt-1">Sistemdeki tüm kayıtlı kullanıcıları ve durumlarını inceleyin.</p>
      </div>

      {/* Filtreler */}
      <div className="bg-surface p-4 rounded-xl border border-surface-variant flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Kullanıcı Ara</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-background border border-surface-variant rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary outline-none"
              placeholder="Nickname veya e-posta ile..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className="w-40">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Durum</label>
          <select
            className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none"
            value={filters.isBanned}
            onChange={e => setFilters({ ...filters, isBanned: e.target.value, page: 1 })}
          >
            <option value="">Tümü</option>
            <option value="false">Aktif</option>
            <option value="true">Banlı</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-surface rounded-xl border border-surface-variant overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-slate-500 text-sm">Kullanıcılar yükleniyor...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-background/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Kullanıcı</th>
                <th className="px-6 py-4">Konum / Dil</th>
                <th className="px-6 py-4">Kayıt Tarihi</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {(data?.items ?? []).map((user: any) => (
                <tr key={user.id} className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-slate-400">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{user.nickname}</div>
                        <div className="text-[11px] text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin size={14} className="text-slate-500" />
                      {user.country_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={14} className="text-slate-500" />
                      {formatDate(user.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.is_banned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldAlert size={12} />
                        Banlı
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck size={12} />
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.is_banned ? (
                      <button
                        onClick={() => unbanMutation.mutate(user.id)}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Banı Kaldır
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBan(user.id)}
                        className="text-xs text-red-400 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Banla
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
