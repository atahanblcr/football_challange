// src/components/questions/EntitySearch.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X, Loader2 } from 'lucide-react';
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
      api.get('/admin/entities/search', { params: { q: query, type: moduleToType(module) } })
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
                       pl-9 pr-10 py-2.5 text-sm text-white outline-none
                       focus:border-primary transition-all shadow-sm"
            placeholder="Entity ara ve listeye ekle..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-surface-variant hover:bg-surface
                     text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors 
                     whitespace-nowrap border border-transparent hover:border-slate-500"
        >
          <Plus size={14} className="text-primary" />
          Yeni Entity
        </button>
      </div>

      {/* Arama sonuçları dropdown */}
      {query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface
                        border border-surface-variant rounded-xl z-50 shadow-2xl overflow-hidden
                        animate-in fade-in zoom-in-95 duration-200">
          {isFetching ? (
            <div className="flex items-center justify-center p-8 gap-3 text-slate-400">
              <Loader2 size={18} className="animate-spin text-primary" />
              <span className="text-sm">Aranıyor...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">Sonuç bulunamadı</p>
              <button 
                onClick={() => setShowModal(true)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                Yeni bir tane oluşturun →
              </button>
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto divide-y divide-surface-variant">
              {results.slice(0, 8).map((entity: any) => (
                <li
                  key={entity.id}
                  onClick={() => handleSelect(entity)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-variant
                             cursor-pointer text-sm transition-colors group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {entity.countryCode ? flagEmoji(entity.countryCode) : '⚽'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{entity.name}</p>
                    {entity.alias?.length > 0 && (
                      <p className="text-slate-500 text-[10px] truncate uppercase tracking-tighter">
                        {entity.alias.join(' • ')}
                      </p>
                    )}
                  </div>
                  <Plus size={14} className="text-slate-600 group-hover:text-primary transition-colors" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Inline entity oluşturma modalı */}
      {showModal && (
        <QuickEntityModal
          defaultType={moduleToType(module)}
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
  const qc = useQueryClient();

  // Çift kayıt kontrolü
  const { data: dupeCheck = [] } = useQuery({
    queryKey: ['entity-dupe-check', form.name],
    queryFn: () =>
      api.get('/admin/entities/check-duplicate', { params: { name: form.name } })
         .then(r => r.data.data),
    enabled: form.name.length >= 3,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        alias: data.alias ? data.alias.split(',').map((s: string) => s.trim()).filter(Boolean) : []
      };
      return api.post('/admin/entities', payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity oluşturuldu');
      onCreated(res.data.data);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-md border border-surface-variant shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Hızlı Entity Ekle</h2>
            <p className="text-xs text-slate-500 mt-0.5">Eksik entity'leri buradan hızlıca ekleyebilirsiniz.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Tip</label>
              <select
                className="w-full bg-background border border-surface-variant rounded-lg
                           px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="player">⚽ Oyuncu</option>
                <option value="club">🏟️ Kulüp</option>
                <option value="national">🌍 Milli Takım</option>
                <option value="manager">👔 Teknik Direktör</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Ülke Kodu</label>
              <input
                className="w-full bg-background border border-surface-variant rounded-lg
                           px-3 py-2 text-sm text-white focus:border-primary outline-none"
                value={form.countryCode}
                onChange={e => setForm({ ...form, countryCode: e.target.value.toUpperCase() })}
                placeholder="TR, AR, DE..."
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Ad</label>
            <input
              className="w-full bg-background border border-surface-variant rounded-lg
                         px-3 py-2.5 text-sm text-white focus:border-primary outline-none shadow-inner"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Lionel Messi"
              autoFocus
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">
              Alias <span className="text-[9px] lowercase italic font-normal text-slate-600">(virgülle ayırın)</span>
            </label>
            <textarea
              className="w-full bg-background border border-surface-variant rounded-lg
                         px-3 py-2 text-sm text-white focus:border-primary outline-none min-h-[60px] resize-none"
              value={form.alias}
              onChange={e => setForm({ ...form, alias: e.target.value })}
              placeholder="Messi, Leo, La Pulga..."
            />
          </div>

          {/* Çift kayıt uyarısı */}
          {dupeCheck.length > 0 && (
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-3 animate-pulse">
              <div className="flex items-center gap-2 mb-1.5">
                <Search size={14} className="text-warning" />
                <p className="text-[11px] font-bold text-warning uppercase">Benzer kayıtlar bulundu:</p>
              </div>
              <ul className="space-y-1">
                {dupeCheck.map((d: any) => (
                  <li key={d.id} className="text-[11px] text-warning/80 flex justify-between">
                    <span>• {d.name}</span>
                    <span className="italic">({d.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-background hover:bg-surface-variant rounded-xl py-3
                       text-sm font-semibold transition-colors text-slate-400 border border-surface-variant"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => createMutation.mutate(form)}
            disabled={!form.name || createMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 rounded-xl py-3
                       text-sm font-bold transition-all disabled:opacity-50 text-white shadow-lg shadow-primary/20"
          >
            {createMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                <span>Ekleniyor...</span>
              </div>
            ) : 'Entity\'yi Ekle'}
          </button>
        </div>
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

function moduleToType(module: string): string {
  const map: Record<string, string> = {
    players: 'player',
    clubs: 'club',
    nationals: 'national',
    managers: 'manager'
  };
  return map[module] || 'player';
}
