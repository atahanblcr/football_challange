import { useState } from 'react';
import { useEntities, useDeleteEntity } from '@/hooks/use-entities';
import { Plus, Search, Edit2, Trash2, Filter, Loader2, User, Home, Globe, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: any = {
  player:   { label: 'Oyuncu', icon: UserCheck, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  club:     { label: 'Kulüp', icon: Home, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  national: { label: 'Milli Takım', icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  manager:  { label: 'T. Direktör', icon: User, color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

export function EntityList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    type: '',
    search: '',
  });

  const { data, isLoading } = useEntities(filters);
  const deleteMutation = useDeleteEntity();

  const handleDelete = (id: string) => {
    if (window.confirm('Bu varlığı silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Entity Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-1">Sistemdeki tüm oyuncu, kulüp ve takımları yönetin.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary/20">
          <Plus size={18} />
          Yeni Entity
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-surface p-4 rounded-xl border border-surface-variant flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[250px]">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Arama</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-background border border-surface-variant rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary outline-none"
              placeholder="Ad veya alias ile ara..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className="w-48">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Tip</label>
          <select
            className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })}
          >
            <option value="">Tümü</option>
            <option value="player">Oyuncu</option>
            <option value="club">Kulüp</option>
            <option value="national">Milli Takım</option>
            <option value="manager">T. Direktör</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="bg-surface rounded-xl border border-surface-variant overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-slate-500 text-sm">Entity'ler yükleniyor...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-background/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Tip</th>
                <th className="px-6 py-4">Ad / Alias</th>
                <th className="px-6 py-4 text-center">Ülke</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {(data?.items ?? []).map((entity: any) => {
                const cfg = TYPE_CONFIG[entity.entity_type] || TYPE_CONFIG.player;
                return (
                  <tr key={entity.id} className="hover:bg-surface-variant/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider", cfg.bg, cfg.color)}>
                        <cfg.icon size={12} />
                        {cfg.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">{entity.name}</div>
                      {entity.aliases?.length > 0 && (
                        <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter truncate max-w-xs">
                          {entity.aliases.join(' • ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-lg">
                      {entity.country_code ? flagEmoji(entity.country_code) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 bg-surface-variant hover:bg-primary/20 text-slate-400 hover:text-primary rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entity.id)}
                          className="p-2 bg-surface-variant hover:bg-wrong/20 text-slate-400 hover:text-wrong rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-background/30 border-t border-surface-variant flex items-center justify-between">
            <span className="text-xs text-slate-500 italic">
              Toplam {data.meta.total} kayıt bulundu.
            </span>
            <div className="flex gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 text-xs bg-surface border border-surface-variant rounded hover:bg-surface-variant disabled:opacity-30 transition-colors"
              >
                Önceki
              </button>
              <button
                disabled={filters.page === data.meta.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 text-xs bg-surface border border-surface-variant rounded hover:bg-surface-variant disabled:opacity-30 transition-colors"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function flagEmoji(code: string) {
  if (!code) return '';
  return code.toUpperCase().split('').map(c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  ).join('');
}
