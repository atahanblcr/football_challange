// src/components/dashboard/ActiveQuestionsTable.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import { MODULE_LABELS, DIFFICULTY_CONFIG } from '@/lib/utils';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ActiveQuestionsTable() {
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['active-questions'],
    queryFn: () => api.get('/admin/questions/calendar').then(r => r.data.data),
    // Sadece bugünü filtreleyeceğiz (backend router'a göre calendar tüm ayı dönebilir)
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayQuestions = (assignments ?? []).filter((a: any) => 
    new Date(a.date).toISOString().split('T')[0] === todayStr
  );

  if (isLoading) return <div className="h-48 bg-surface rounded-xl animate-pulse" />;

  return (
    <div className="bg-surface rounded-xl border border-surface-variant overflow-hidden shadow-lg">
      <div className="px-4 py-3 border-b border-surface-variant flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">📅 Bugün Aktif Sorular</h2>
        <Link to="/questions/calendar" className="text-xs text-primary hover:underline">Tümünü Gör</Link>
      </div>
      
      <table className="w-full text-left text-sm">
        <thead className="bg-background/50 text-slate-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Modül</th>
            <th className="px-4 py-3">Soru Başlığı</th>
            <th className="px-4 py-3">Durum</th>
            <th className="px-4 py-3">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant">
          {todayQuestions.map((assignment: any) => (
            <tr key={assignment.id} className="hover:bg-surface-variant/30 transition-colors">
              <td className="px-4 py-3">
                <span className="text-xs bg-surface-variant px-2 py-1 rounded">
                  {MODULE_LABELS[assignment.question.module] || assignment.question.module}
                </span>
              </td>
              <td className="px-4 py-3 font-medium text-slate-200">
                {assignment.question.title}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Yayında
                </span>
              </td>
              <td className="px-4 py-3">
                <Link 
                  to={`/questions/${assignment.question.id}/edit`}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <ExternalLink size={16} />
                </Link>
              </td>
            </tr>
          ))}
          {todayQuestions.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                Bugün için atanmış soru bulunamadı.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
