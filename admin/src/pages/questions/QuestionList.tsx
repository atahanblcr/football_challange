// src/pages/questions/QuestionList.tsx
import { useState } from 'react';
import { useQuestions, useArchiveQuestion } from '@/hooks/use-questions';
import { MODULE_LABELS, DIFFICULTY_CONFIG, STATUS_CONFIG, formatDate } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, Calendar, Filter, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function QuestionList() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    module: '',
    status: '',
    search: '',
  });

  const { data, isLoading } = useQuestions(filters);
  const archiveMutation = useArchiveQuestion();

  const handleArchive = (id: string) => {
    if (window.confirm('Bu soruyu arşivlemek istediğinize emin misiniz?')) {
      archiveMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sorular</h1>
          <p className="text-sm text-slate-500 mt-1">Tüm modüllerdeki soruları yönetin ve yenilerini oluşturun.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/questions/calendar"
            className="flex items-center gap-2 bg-surface hover:bg-surface-variant text-slate-300 px-4 py-2 rounded-lg border border-surface-variant transition-colors"
          >
            <Calendar size={18} />
            Takvim
          </Link>
          <Link
            to="/questions/create"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            Yeni Soru
          </Link>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-surface p-4 rounded-xl border border-surface-variant flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Arama</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              className="w-full bg-background border border-surface-variant rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-primary outline-none"
              placeholder="Soru başlığı ara..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>

        <div className="w-48">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Modül</label>
          <select
            className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none"
            value={filters.module}
            onChange={e => setFilters({ ...filters, module: e.target.value, page: 1 })}
          >
            <option value="">Tümü</option>
            {Object.entries(MODULE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Durum</label>
          <select
            className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none appearance-none"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="draft">Taslak</option>
            <option value="archived">Arşiv</option>
            <option value="special">Özel</option>
          </select>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-surface rounded-xl border border-surface-variant overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-slate-500 text-sm">Sorular yükleniyor...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-background/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Modül / Kategori</th>
                <th className="px-6 py-4">Soru Başlığı</th>
                <th className="px-6 py-4">Zorluk / Süre</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {(data?.items ?? []).map((question: any) => (
                <tr key={question.id} className="hover:bg-surface-variant/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-xs bg-surface-variant px-2 py-1 rounded text-slate-300 font-medium">
                      {MODULE_LABELS[question.module] || question.module}
                    </span>
                    {question.category && (
                      <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-tighter">{question.category}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-200">
                    <div className="max-w-md truncate" title={question.title}>
                      {question.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-slate-500 italic">
                        {question.answerCount} cevap • {question._count?.gameSessions ?? 0} çözüm
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${DIFFICULTY_CONFIG[question.difficulty]?.color}`}>
                      {DIFFICULTY_CONFIG[question.difficulty]?.label}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">{question.timeLimit} saniye</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${STATUS_CONFIG[question.status]?.color}`}>
                      {STATUS_CONFIG[question.status]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        to={`/questions/${question.id}/edit`}
                        className="p-2 bg-surface-variant hover:bg-primary/20 text-slate-400 hover:text-primary rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Edit2 size={16} />
                      </Link>
                      {question.status !== 'archived' && (
                        <button
                          onClick={() => handleArchive(question.id)}
                          className="p-2 bg-surface-variant hover:bg-wrong/20 text-slate-400 hover:text-wrong rounded-lg transition-colors"
                          title="Arşivle"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">
                    Kriterlere uygun soru bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="px-6 py-4 bg-background/30 border-t border-surface-variant flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Toplam <strong>{data.meta.total}</strong> soru arasından <strong>{(filters.page - 1) * filters.limit + 1}-{Math.min(filters.page * filters.limit, data.meta.total)}</strong> arası gösteriliyor.
            </span>
            <div className="flex gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="px-3 py-1.5 text-xs bg-surface border border-surface-variant rounded hover:bg-surface-variant disabled:opacity-30 transition-colors"
              >
                ← Önceki
              </button>
              <button
                disabled={filters.page === data.meta.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="px-3 py-1.5 text-xs bg-surface border border-surface-variant rounded hover:bg-surface-variant disabled:opacity-30 transition-colors"
              >
                Sonraki →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
