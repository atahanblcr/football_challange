import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import { MODULE_LABELS } from '@/lib/utils';
import { useTriggerAssignments } from '@/hooks/use-questions';
import { 
  ChevronLeft, ChevronRight, Loader2, Sparkles, PlusCircle 
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, 
  endOfMonth, eachDayOfInterval, isSameDay, isToday,
  startOfWeek, endOfWeek
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { DayAssignmentModal } from './DayAssignmentModal';

const MODULES = ['players', 'clubs', 'nationals', 'managers'];

export function QuestionCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const triggerMutation = useTriggerAssignments();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Soru Takvimi</h1>
          <p className="text-sm text-slate-500 mt-1">Günlük atanan soruları takip edin ve planlayın.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
          >
            {triggerMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Eksik Soruları Otomatik Tamamla
          </button>

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
                <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/20" />
                <span className="text-xs text-slate-300">Özel Etkinlik</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-wrong shadow-sm shadow-wrong/20" />
                <span className="text-xs text-slate-300">Modül Eksik</span>
              </div>
            </div>
            <div className="pt-4 border-t border-surface-variant/50">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                * Günlerin üzerine tıklayarak o güne atanan soruları değiştirebilir veya manuel atama yapabilirsiniz.
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
                  // UTC Tarih dizesini oluştur (YYYY-MM-DD)
                  const dayStr = format(day, 'yyyy-MM-dd');
                  
                  const dayAssignments = (assignments ?? []).filter((a: any) => {
                    if (!a.date) return false;
                    const assignmentDateStr = a.date.split('T')[0];
                    return assignmentDateStr === dayStr;
                  });
                  
                  const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);

                  return (
                    <div 
                      key={dayStr}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[120px] p-2 transition-all relative cursor-pointer ${
                        !isCurrentMonth ? 'bg-background/20 opacity-30' : 'bg-surface hover:bg-surface-variant/40'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${
                          isToday(day) ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-primary/30' : 'text-slate-400'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlusCircle size={14} className="text-slate-600" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        {MODULES.map(mod => {
                          const normalAss = dayAssignments.find((a: any) => 
                            (a.module === mod || a.question?.module === mod) && !a.isSpecial
                          );
                          const specialAss = dayAssignments.find((a: any) => 
                            (a.module === mod || a.question?.module === mod) && a.isSpecial
                          );
                          
                          return (
                            <div key={mod} className="flex gap-0.5">
                              <div 
                                title={normalAss ? normalAss.question?.title : `${MODULE_LABELS[mod]} Eksik`}
                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                  normalAss ? 'bg-correct' : 'bg-wrong opacity-30 group-hover:opacity-100'
                                }`}
                              />
                              {specialAss && (
                                <div 
                                  title={`ÖZEL: ${specialAss.question?.title}`}
                                  className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedDay && (
        <DayAssignmentModal 
          date={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
