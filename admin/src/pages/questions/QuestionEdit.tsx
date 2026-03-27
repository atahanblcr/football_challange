import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuestion, useUpdateQuestion } from '@/hooks/use-questions';
import { AnswerDragList, AnswerItem } from '@/components/questions/AnswerDragList';
import { EntitySearch } from '@/components/questions/EntitySearch';
import { MODULE_LABELS, DIFFICULTY_CONFIG } from '@/lib/utils';
import { ArrowLeft, Save, Rocket, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function QuestionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: question, isLoading } = useQuestion(id!);
  const updateMutation = useUpdateQuestion(id!);

  const [form, setForm] = useState({
    title: '',
    module: 'players',
    category: '',
    difficulty: 'medium',
    basePoints: 100,
    timeLimit: 60,
    status: 'draft',
    isSpecial: false,
    specialEventId: '',
    scheduledFor: '',
  });

  const [answers, setAnswers] = useState<AnswerItem[]>([]);

  // Load question data
  useEffect(() => {
    if (question) {
      setForm({
        title: question.title,
        module: question.module,
        category: question.category || '',
        difficulty: question.difficulty,
        basePoints: question.basePoints,
        timeLimit: question.timeLimit,
        status: question.status,
        isSpecial: question.isSpecial,
        specialEventId: question.specialEventId || '',
        scheduledFor: question.scheduledFor ? new Date(question.scheduledFor).toISOString().split('T')[0] : '',
      });

      const mappedAnswers = (question.answers || []).map((a: any) => ({
        id: crypto.randomUUID(),
        entityId: a.entityId,
        entityName: a.entity.name,
        countryCode: a.entity.countryCode,
        statValue: a.statValue,
        statDisplay: a.statDisplay || '',
      }));
      setAnswers(mappedAnswers);
    }
  }, [question]);

  const handleSubmit = async (status: string) => {
    if (!form.title) return toast.error('Lütfen bir başlık girin.');
    if (answers.length < 1) return toast.error('En az bir cevap eklemelisiniz.');

    const payload = {
      ...form,
      status,
      answers: answers.map((a, idx) => ({
        entityId: a.entityId,
        rank: idx + 1,
        statValue: a.statValue,
        statDisplay: a.statDisplay || `${a.statValue}`,
      })),
      scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    };

    updateMutation.mutate(payload, {
      onSuccess: () => navigate('/questions'),
    });
  };

  const handleAddAnswer = (item: AnswerItem) => {
    if (answers.some(a => a.entityId === item.entityId)) {
      return toast.error('Bu entity zaten eklenmiş.');
    }
    setAnswers([...answers, item]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-slate-500 text-sm">Soru yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/questions" className="p-2 hover:bg-surface rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Soruyu Düzenle</h1>
            <p className="text-sm text-slate-500 mt-0.5">Mevcut soru bilgilerini güncelleyin.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleSubmit(form.status)}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/25"
          >
            {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Kaydet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-surface-variant shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary rounded-full" />
              Temel Bilgiler
            </h2>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Soru Başlığı</label>
              <textarea
                className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none min-h-[100px] resize-none text-lg font-medium"
                placeholder="Soru başlığını girin..."
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Modül</label>
                <select
                  className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                  value={form.module}
                  onChange={e => setForm({ ...form, module: e.target.value })}
                >
                  {Object.entries(MODULE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Kategori</label>
                <input
                  className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2.5 text-sm text-white focus:border-primary outline-none"
                  placeholder="Kategori girin..."
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-correct rounded-full" />
                Cevaplar ({answers.length})
              </h2>
              <div className="text-[10px] text-slate-500 italic">Rank 1 = En kolay (az puan), Son rank = En zor</div>
            </div>

            <EntitySearch module={form.module} onSelect={handleAddAnswer} />
            <AnswerDragList answers={answers} onChange={setAnswers} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-2xl border border-surface-variant shadow-sm space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-warning rounded-full" />
              Soru Ayarları
            </h2>

            <div>
              <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Zorluk Seviyesi</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: key })}
                    className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                      form.difficulty === key 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-background border-surface-variant text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {cfg.label.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Süre (sn)</label>
                <input
                  type="number"
                  className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                  value={form.timeLimit}
                  onChange={e => setForm({ ...form, timeLimit: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Baz Puan</label>
                <input
                  type="number"
                  className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                  value={form.basePoints}
                  onChange={e => setForm({ ...form, basePoints: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="isSpecial"
                  className="w-4 h-4 rounded border-surface-variant bg-background text-primary focus:ring-primary"
                  checked={form.isSpecial}
                  onChange={e => setForm({ ...form, isSpecial: e.target.checked })}
                />
                <label htmlFor="isSpecial" className="text-sm text-slate-300 font-medium cursor-pointer">Özel Etkinlik Sorusu</label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase tracking-wider">Programlı Yayın Tarihi</label>
                <input
                  type="date"
                  className="w-full bg-background border border-surface-variant rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                  value={form.scheduledFor}
                  onChange={e => setForm({ ...form, scheduledFor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex gap-3">
            <AlertCircle size={20} className="text-primary shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Düzenlediğiniz sorunun durumu şu an <strong>{form.status.toUpperCase()}</strong>. Kaydet dediğinizde mevcut durum korunacaktır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
