import { useState } from 'react';
import { useEvents, useActivateEvent, useCreateEvent, useUpdateEvent } from '@/hooks/use-events';
import { Plus, Star, Calendar, CheckCircle2, Loader2, Rocket, X, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export function EventList() {
  const { data: events = [], isLoading } = useEvents();
  const activateMutation = useActivateEvent();
  const [modal, setModal] = useState<{ show: boolean; event?: any }>({ show: false });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Özel Etkinlikler</h1>
          <p className="text-sm text-slate-500 mt-1">Sınırlı süreli etkinlikleri ve özel turnuva sorularını yönetin.</p>
        </div>
        <button 
          onClick={() => setModal({ show: true })}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
        >
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
                event.isActive ? 'border-primary ring-1 ring-primary' : 'border-surface-variant'
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
                      {formatDate(event.startsAt)} — {formatDate(event.endsAt)}
                    </div>
                  </div>
                </div>
                {event.isActive && (
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
                {!event.isActive ? (
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
                <button 
                  onClick={() => setModal({ show: true, event })}
                  className="px-4 py-2.5 bg-surface hover:bg-surface-variant text-slate-400 rounded-lg border border-surface-variant transition-colors"
                >
                  <Edit2 size={14} />
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

      {modal.show && (
        <EventModal 
          event={modal.event} 
          onClose={() => setModal({ show: false })} 
        />
      )}
    </div>
  );
}

function EventModal({ event, onClose }: { event?: any; onClose: () => void }) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent(event?.id);
  
  const [form, setForm] = useState({
    name: event?.name || '',
    icon: event?.icon || '🏆',
    colorHex: event?.colorHex || '#1A56DB',
    startsAt: event?.startsAt ? new Date(event.startsAt).toISOString().split('T')[0] : '',
    endsAt: event?.endsAt ? new Date(event.endsAt).toISOString().split('T')[0] : '',
    description: event?.description || '',
  });

  const handleSubmit = () => {
    if (!form.name || !form.startsAt || !form.endsAt) {
      return toast.error('Lütfen zorunlu alanları doldurun');
    }

    const payload = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    };

    if (event) {
      updateMutation.mutate(payload, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl p-6 w-full max-w-lg border border-surface-variant shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{event ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Etkinlik Adı</label>
              <input
                className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Dünya Kupası 2026"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">İkon</label>
              <input
                className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white text-center focus:border-primary outline-none"
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="🏆"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Başlangıç</label>
              <input
                type="date"
                className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                value={form.startsAt}
                onChange={e => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Bitiş</label>
              <input
                type="date"
                className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
                value={form.endsAt}
                onChange={e => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Açıklama</label>
            <textarea
              className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none min-h-[80px] resize-none"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Etkinlik hakkında kısa bilgi..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-semibold">İptal</button>
          <button 
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            <Save size={18} />
            {event ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </div>
    </div>
  );
}

const Edit2 = ({ size, className }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);
