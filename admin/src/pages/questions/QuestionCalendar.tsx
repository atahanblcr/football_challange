import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import { MODULE_LABELS } from '@/lib/utils';
import { 
  ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, eachDayOfInterval, isSameDay, isToday,
  startOfWeek, endOfWeek
} from 'date-fns';
import { tr } from 'date-fns/locale';

const MODULES = ['players', 'clubs', 'nationals', 'managers'];

export function QuestionCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['questions-calendar', format(currentMonth, 'yyyy-MM')],
    queryFn: () => api.get('/admin/questions/calendar', {
      params: { 
        month: currentMonth.getMonth() + 1, 
        year: currentMonth.getFullYear() 
      }
    }).then(r => r.data.data),
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Soru Takvimi</h1>
          <p className="text-sm text-slate-500 mt-1">Günlük atanan soruları takip edin ve planlayın.</p>
        </div>
        <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-xl border border-surface-variant shadow-lg">
          <button onClick={prevMonth} className="p-1 hover:bg-surface-variant rounded-lg transition-colors text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-sm font-bold text-slate-200 min-w-[120px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </h2>
          <button onClick={nextMonth} className="p-1 hover:bg-surface-variant rounded-lg transition-colors text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sol Kolon: Açıklama & Özet */}
        <div className="space-y-4">
          <div className="bg-surface p-5 rounded-2xl border border-surface-variant shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Takvim Rehberi</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-correct shadow-sm shadow-correct/20" />
                <span className="text-xs text-slate-300">Modül Atanmış</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-wrong shadow-sm shadow-wrong/20" />
                <span className="text-xs text-slate-300">Modül Eksik</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-surface-variant" />
                <span className="text-xs text-slate-300">Planlanmamış</span>
              </div>
            </div>
            <div className="pt-4 border-t border-surface-variant/50">
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                * Sorular her gün 00:05'te (UTC+3) otomatik olarak atanır. Manuel atama yapmak için soru düzenleme ekranını kullanın.
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Takvim Grid */}
        <div className="lg:col-span-3">
          <div className="bg-surface rounded-2xl border border-surface-variant shadow-2xl overflow-hidden">
            {/* Gün isimleri */}
            <div className="grid grid-cols-7 bg-background/50 border-b border-surface-variant">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                <div key={d} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {d}
                </div>
              ))}
            </div>

            {/* Günler grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-surface-variant border-l border-t border-surface-variant">
              {isLoading ? (
                <div className="col-span-7 h-96 flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-primary" />
                </div>
              ) : (
                days.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayAssignments = (assignments ?? []).filter((a: any) => {
                    // API'den gelen ISO string'in (2026-03-30T00:00:00.000Z) tarih kısmını al
                    const assignmentDateStr = a.date.split('T')[0];
                    return assignmentDateStr === dayStr;
                  });
                  
                  const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);

                  return (
                    <div 
                      key={dayStr}
                      className={`min-h-[120px] p-2 transition-colors relative group ${
                        !isCurrentMonth ? 'bg-background/20 opacity-30' : 'bg-surface hover:bg-surface-variant/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${
                          isToday(day) ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-primary/30' : 'text-slate-400'
                        }`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {MODULES.map(mod => {
                          const ass = dayAssignments.find((a: any) => 
                            a.module === mod || a.question?.module === mod
                          );
                          return (
                            <div 
                              key={mod}
                              title={ass ? ass.question?.title : `${MODULE_LABELS[mod]} Eksik`}
                              className={`h-1.5 rounded-full transition-all ${
                                ass ? 'bg-correct' : 'bg-wrong opacity-30 group-hover:opacity-100'
                              }`}
                            />
                          );
                        })}
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-surface/90 flex flex-col p-3 z-10 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-primary mb-2 border-b border-primary/20 pb-1">
                          {format(day, 'd MMMM', { locale: tr })}
                        </span>
                        <div className="space-y-1.5 overflow-y-auto">
                          {MODULES.map(mod => {
                            const ass = dayAssignments.find((a: any) => 
                              a.module === mod || a.question?.module === mod
                            );
                            return (
                              <div key={mod} className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ass ? 'bg-correct' : 'bg-wrong'}`} />
                                <span className="text-[9px] text-slate-300 truncate max-w-[100px]">
                                  {ass ? ass.question?.title : `${MODULE_LABELS[mod]} Eksik`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
