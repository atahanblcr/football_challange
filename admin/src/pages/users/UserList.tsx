import { useState } from 'react';
import { useUsers, useBanUser, useUnbanUser } from '@/hooks/use-users';
import { Search, ShieldAlert, ShieldCheck, User, MapPin, Calendar, Loader2, X, Award, PlayCircle, Hash } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import toast from 'react-hot-toast';

export function UserList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    isBanned: '',
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: currentAdmin } = useQuery({
    queryKey: ['admin-me'],
    queryFn: () => api.get('/admin/auth/me').then(r => r.data.data),
  });

  const { data, isLoading } = useUsers(filters);
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const isModerator = currentAdmin?.role === 'moderator';

  const handleBan = (id: string) => {
    if (isModerator) {
      if (window.confirm('Bu kullanıcı için ban önerisinde bulunmak istiyor musunuz?')) {
        api.post(`/admin/users/${id}/ban-suggest`).then(() => {
          toast.success('Ban önerisi gönderildi');
        });
      }
    } else {
      const reason = window.prompt('Ban sebebi girin:');
      if (reason) banMutation.mutate({ id, reason });
    }
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
                <tr key={user.id} className="hover:bg-surface-variant/30 transition-colors group cursor-pointer" onClick={() => setSelectedUser(user)}>
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
                      {user.countryCode}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={14} className="text-slate-500" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBanned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldAlert size={12} />
                        Banlı
                      </span>
                    ) : user.banSuggested ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldAlert size={12} />
                        Ban Önerildi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck size={12} />
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.isBanned ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); unbanMutation.mutate(user.id); }}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Banı Kaldır
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleBan(user.id); }}
                        className="text-xs text-red-400 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isModerator ? 'Ban Öner' : 'Banla'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
  const { data: detail, isLoading } = useQuery({
    queryKey: ['user-detail', user.id],
    queryFn: () => api.get(`/admin/users/${user.id}`).then(r => r.data.data),
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 w-full sm:max-w-2xl border border-surface-variant shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-variant flex items-center justify-center text-primary text-3xl shadow-inner border border-surface-variant">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">{user.nickname}</h2>
              <p className="text-slate-500 text-sm">{user.email || 'E-posta tanımlanmamış'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : (
          <div className="space-y-8">
            {/* Üst İstatistik Kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-background/40 p-4 rounded-2xl border border-surface-variant/50">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
                  <Award size={14} className="text-purple-400" />
                  Toplam Puan
                </div>
                <div className="text-xl font-bold text-white">{formatNumber(detail?.totalScore || 0)}</div>
              </div>
              <div className="bg-background/40 p-4 rounded-2xl border border-surface-variant/50">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
                  <Hash size={14} className="text-primary" />
                  Çözülen Soru
                </div>
                <div className="text-xl font-bold text-white">{detail?.sessionsCount || 0}</div>
              </div>
              <div className="bg-background/40 p-4 rounded-2xl border border-surface-variant/50">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
                  <PlayCircle size={14} className="text-correct" />
                  Reklam İzleme
                </div>
                <div className="text-xl font-bold text-white">{detail?.adsWatched || 0}</div>
              </div>
              <div className="bg-background/40 p-4 rounded-2xl border border-surface-variant/50">
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase mb-2">
                  <Calendar size={14} className="text-warning" />
                  Kayıt Tarihi
                </div>
                <div className="text-sm font-bold text-white mt-1">{formatDate(user.createdAt)}</div>
              </div>
            </div>

            {/* Detay Bilgiler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-variant/20 rounded-2xl p-5 border border-surface-variant">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Profil Bilgileri</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-surface-variant/30">
                    <span className="text-xs text-slate-500">Ülke</span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin size={12} /> {user.countryCode || 'Bilinmiyor'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-surface-variant/30">
                    <span className="text-xs text-slate-500">Abonelik Tipi</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      user.subscriptionTier === 'premium' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {user.subscriptionTier}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-surface-variant/30">
                    <span className="text-xs text-slate-500">Referans Kodu</span>
                    <span className="text-xs font-mono font-bold text-primary">{user.referralCode}</span>
                  </div>
                </div>
              </div>

              {/* Şüpheli Aktivite Paneli */}
              <div className={`rounded-2xl p-5 border ${
                detail?.suspiciousSessions?.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
              }`}>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${
                  detail?.suspiciousSessions?.length > 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  <ShieldAlert size={16} />
                  Şüpheli Aktivite {detail?.suspiciousSessions?.length > 0 && `(${detail.suspiciousSessions.length})`}
                </h3>
                
                {detail?.suspiciousSessions?.length > 0 ? (
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {detail.suspiciousSessions.map((s: any) => (
                      <div key={s.id} className="bg-background/40 border border-red-500/10 rounded-xl px-3 py-2.5 text-[11px]">
                        <div className="flex justify-between font-bold text-red-200/70 mb-1">
                          <span>{formatDate(s.submittedAt)}</span>
                          <span className="text-[9px] opacity-50">ID: {s.id.slice(-6)}</span>
                        </div>
                        <p className="text-slate-400 italic leading-relaxed">{s.suspiciousReason}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShieldCheck size={32} className="text-green-500/30 mb-2" />
                    <p className="text-[11px] text-green-400 font-medium">Bu kullanıcıya ait şüpheli bir kayıt bulunamadı.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Son Oturumlar */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Son 20 Oturum</h3>
              <div className="bg-background/30 rounded-2xl border border-surface-variant overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-variant/30 text-slate-500 uppercase text-[9px] font-bold">
                    <tr>
                      <th className="px-4 py-3">Tarih</th>
                      <th className="px-4 py-3">Puan</th>
                      <th className="px-4 py-3">Reklam</th>
                      <th className="px-4 py-3 text-right">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-variant/20">
                    {detail?.gameSessions?.map((s: any) => (
                      <tr key={s.id} className="hover:bg-surface-variant/10 transition-colors">
                        <td className="px-4 py-3 text-slate-300 font-medium">{formatDate(s.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-white">{s.scoreFinal}</span>
                        </td>
                        <td className="px-4 py-3">
                          {s.adMultiplied ? (
                            <span className="text-correct flex items-center gap-1 font-bold text-[10px]">
                              <PlayCircle size={12} /> ×1.5
                            </span>
                          ) : <span className="text-slate-600">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.flagSuspicious ? (
                            <span className="text-red-400 font-bold">Şüpheli</span>
                          ) : (
                            <span className="text-correct">Tamamlandı</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
