import { useState } from 'react';
import { useQuestions, useAssignManual } from '@/hooks/use-questions';
import { X, Search, Loader2, Check } from 'lucide-react';

interface Props {
  module: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  dateStr: string;
  isSpecial: boolean;
}

export function QuestionPickerModal({ module, onClose, onSelect, dateStr, isSpecial }: Props) {
  const [search, setSearch] = useState('');
  const { data: result, isLoading } = useQuestions({ module, status: 'active', search });
  const questions = result?.items || [];
  const assignManual = useAssignManual();

  const handleSelect = (questionId: string) => {
    assignManual.mutate({
      date: dateStr,
      module,
      questionId,
      isSpecial
    }, {
      onSuccess: () => {
        onSelect(questionId);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg border border-surface-variant shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-surface-variant flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Soru Seç: <span className="text-primary">{module}</span></h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-variant rounded-lg text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              autoFocus
              className="w-full bg-background border border-surface-variant rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none"
              placeholder="Soru başlığı ile ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : questions.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500 font-medium italic">Uygun soru bulunamadı.</p>
            ) : (
              questions.map((q: any) => (
                <button
                  key={q.id}
                  onClick={() => handleSelect(q.id)}
                  disabled={assignManual.isPending}
                  className="w-full text-left p-3 rounded-xl hover:bg-surface-variant group transition-colors flex items-center justify-between border border-transparent hover:border-surface-variant"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white">{q.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{q.category}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span className={`text-[10px] font-bold ${
                        q.difficulty === 'easy' ? 'text-correct' : q.difficulty === 'medium' ? 'text-amber-400' : 'text-wrong'
                      }`}>
                        {q.difficulty.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-surface-variant">
                    {assignManual.isPending && assignManual.variables?.questionId === q.id ? (
                      <Loader2 size={16} className="animate-spin text-primary" />
                    ) : (
                      <Check size={16} className="text-primary" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-3 bg-background/50 border-t border-surface-variant flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors">
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}
