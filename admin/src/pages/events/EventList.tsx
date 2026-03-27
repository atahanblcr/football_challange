import { useEvents, useActivateEvent } from '@/hooks/use-events';
import { Plus, Star, Calendar, CheckCircle2, Loader2, Rocket } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function EventList() {
  const { data: events = [], isLoading } = useEvents();
  const activateMutation = useActivateEvent();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Özel Etkinlikler</h1>
          <p className="text-sm text-slate-500 mt-1">Sınırlı süreli etkinlikleri ve özel turnuva sorularını yönetin.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary/20">
          <Plus size={18} />
          Yeni Etkinlik
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-slate-500">Etkinlikler yükleniyor...</p>
          </div>
        ) : (
          events.map((event: any) => (
            <div
              key={event.id}
              className={`bg-surface rounded-2xl border transition-all overflow-hidden flex flex-col shadow-xl ${
                event.is_active ? 'border-primary ring-1 ring-primary' : 'border-surface-variant'
              }`}
            >
              {/* Header */}
              <div className="p-5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center text-2xl shadow-inner">
                    {event.icon || '🏆'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{event.name}</h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <Calendar size={12} />
                      {formatDate(event.starts_at)} — {formatDate(event.ends_at)}
                    </div>
                  </div>
                </div>
                {event.is_active && (
                  <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border border-primary/20">
                    Aktif
                  </span>
                )}
              </div>

              {/* Stats/Info */}
              <div className="flex-1 px-5 pb-5 space-y-4">
                <div className="bg-background/40 rounded-xl p-3 border border-surface-variant/50">
                  <div className="flex justify-between items-center text-xs text-slate-500 mb-2 uppercase font-bold tracking-tighter">
                    <span>Soru Havuzu</span>
                    <span className="text-slate-300 font-bold">{event._count?.questions ?? 0} Soru</span>
                  </div>
                  <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/3 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Footer / Actions */}
              <div className="p-4 bg-background/30 border-t border-surface-variant flex gap-2">
                {!event.is_active ? (
                  <button
                    onClick={() => activateMutation.mutate(event.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-surface hover:bg-surface-variant text-slate-300 text-xs font-bold py-2.5 rounded-lg transition-all border border-surface-variant"
                  >
                    <Rocket size={14} className="text-primary" />
                    Etkinliği Başlat
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-primary/5 text-primary text-xs font-bold py-2.5 rounded-lg border border-primary/20">
                    <CheckCircle2 size={14} />
                    Şu An Aktif
                  </div>
                )}
                <button className="px-4 py-2.5 bg-surface hover:bg-surface-variant text-slate-400 rounded-lg border border-surface-variant transition-colors">
                  <Star size={14} />
                </button>
              </div>
            </div>
          ))
        )}

        {!isLoading && events.length === 0 && (
          <div className="col-span-full py-20 bg-surface rounded-2xl border border-dashed border-surface-variant flex flex-col items-center justify-center text-slate-500 gap-4">
            <Star size={40} className="text-slate-600 opacity-20" />
            <p>Henüz bir etkinlik oluşturulmamış.</p>
          </div>
        )}
      </div>
    </div>
  );
}
