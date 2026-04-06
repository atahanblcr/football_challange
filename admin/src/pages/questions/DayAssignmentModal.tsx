import { useState } from 'react';
import { useAssignmentsByDate, useAssignRandom, useAssignManual } from '@/hooks/use-questions';
import { X, Loader2, Shuffle, Search, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { MODULE_LABELS } from '@/lib/utils';
import { QuestionPickerModal } from './QuestionPickerModal';

interface Props {
  date: Date;
  onClose: () => void;
}

const MODULES = ['players', 'clubs', 'nationals', 'managers'] as const;

export function DayAssignmentModal({ date, onClose }: Props) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { data: assignments = [], isLoading } = useAssignmentsByDate(dateStr);
  const assignRandom = useAssignRandom();
  const [picker, setPicker] = useState<{ module: string; isSpecial: boolean } | null>(null);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl border border-surface-variant shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-surface-variant flex items-center justify-between bg-background/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Günlük Atamalar</h2>
              <p className="text-xs text-slate-500 font-medium">
                {format(date, 'd MMMM yyyy, EEEE', { locale: tr })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-sm text-slate-500">Atamalar yükleniyor...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {MODULES.map(module => {
                const assignment = assignments.find((a: any) => a.module === module && !a.isSpecial);
                const isAssigningRandom = assignRandom.isPending && assignRandom.variables?.module === module;

                return (
                  <div key={module} className="group bg-background/40 border border-surface-variant/50 rounded-2xl p-4 flex items-center justify-between hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${assignment ? 'bg-correct' : 'bg-wrong opacity-50'}`} />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-0.5">
                          {MODULE_LABELS[module]}
                        </div>
                        {assignment ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-200">{assignment.question.title}</span>
                            <CheckCircle2 size={14} className="text-correct" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">Soru atanmamış</span>
                            <AlertCircle size={14} className="text-wrong" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setPicker({ module, isSpecial: false })}
                        className="p-2 bg-surface hover:bg-surface-variant text-slate-400 hover:text-white rounded-lg border border-surface-variant transition-all flex items-center gap-2 text-xs font-bold"
                      >
                        <Search size={14} />
                        Soru Seç
                      </button>
                      <button
                        disabled={isAssigningRandom}
                        onClick={() => assignRandom.mutate({ date: dateStr, module, isSpecial: false })}
                        className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-all flex items-center gap-2 text-xs font-bold disabled:opacity-50"
                      >
                        {isAssigningRandom ? <Loader2 size={14} className="animate-spin" /> : <Shuffle size={14} />}
                        Rastgele
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-background/50 border-t border-surface-variant flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-surface hover:bg-surface-variant text-white font-bold rounded-xl border border-surface-variant transition-all">
            Kapat
          </button>
        </div>
      </div>

      {picker && (
        <QuestionPickerModal
          module={picker.module}
          onClose={() => setPicker(null)}
          onSelect={(questionId) => {
            // Manual assign mutasyonunu burada çağıracağız
            // Not: useAssignManual hook'unu burada da kullanabiliriz veya handleSelect olarak geçebiliriz.
            // Ama props üzerinden gitmek daha temiz.
            setPicker(null);
          }}
          dateStr={dateStr}
          isSpecial={picker.isSpecial}
        />
      )}
    </div>
  );
}
