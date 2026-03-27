import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import { 
  Settings, Shield, RefreshCw, Save, 
  Trash2, Plus, UserPlus, Loader2, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'app' | 'admins'>('app');

  // App Config
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['app-config'],
    queryFn: () => api.get('/admin/app-config').then(r => r.data.data),
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: any) => api.patch('/admin/app-config', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['app-config'] });
      toast.success('Uygulama ayarları güncellendi');
    },
  });

  // Admin Users
  const { data: admins, isLoading: adminsLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/admins').then(r => r.data.data),
    enabled: activeTab === 'admins',
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/admins/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Admin silindi');
    },
  });

  if (configLoading) return <div className="p-6">Yükleniyor...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sistem Ayarları</h1>
          <p className="text-sm text-slate-500 mt-1">Uygulama versiyonlarını ve yönetici erişimlerini kontrol edin.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-variant">
        <button
          onClick={() => setActiveTab('app')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'app' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Uygulama Yapılandırması
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${
            activeTab === 'admins' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Yöneticiler
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'app' ? (
          <AppConfigForm config={config} onSave={(data) => updateConfigMutation.mutate(data)} isPending={updateConfigMutation.isPending} />
        ) : (
          <AdminUserList admins={admins} onDelete={(id) => deleteAdminMutation.mutate(id)} isLoading={adminsLoading} />
        )}
      </div>
    </div>
  );
}

function AppConfigForm({ config, onSave, isPending }: any) {
  const [form, setForm] = useState({
    minimum_version: config?.minimum_version || '1.0.0',
    latest_version: config?.latest_version || '1.0.0',
    force_update: config?.force_update || false,
  });

  return (
    <div className="max-w-2xl bg-surface p-8 rounded-2xl border border-surface-variant shadow-xl space-y-6">
      <div className="flex items-center gap-3 text-primary mb-2">
        <Settings size={20} />
        <h2 className="font-bold uppercase tracking-wider text-sm">Versiyon Yönetimi</h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">Minimum Versiyon</label>
          <input
            className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            value={form.minimum_version}
            onChange={e => setForm({ ...form, minimum_version: e.target.value })}
          />
          <p className="text-[10px] text-slate-600 mt-2 italic">Bu versiyonun altındaki kullanıcılar uygulamayı kullanamaz.</p>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 mb-2 block uppercase">En Güncel Versiyon</label>
          <input
            className="w-full bg-background border border-surface-variant rounded-xl px-4 py-3 text-white focus:border-primary outline-none"
            value={form.latest_version}
            onChange={e => setForm({ ...form, latest_version: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-background/50 p-4 rounded-xl border border-surface-variant flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-200">Zorunlu Güncelleme (Force Update)</h3>
          <p className="text-xs text-slate-500 mt-1">Aktif edilirse tüm kullanıcılara güncelleme ekranı gösterilir.</p>
        </div>
        <button
          onClick={() => setForm({ ...form, force_update: !form.force_update })}
          className={`w-12 h-6 rounded-full transition-all relative ${form.force_update ? 'bg-primary' : 'bg-slate-700'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.force_update ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      <div className="pt-4">
        <button
          onClick={() => onSave(form)}
          disabled={isPending}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Değişiklikleri Kaydet
        </button>
      </div>
    </div>
  );
}

function AdminUserList({ admins, onDelete, isLoading }: any) {
  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="bg-surface rounded-2xl border border-surface-variant overflow-hidden shadow-xl">
      <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-background/30">
        <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Aktif Yöneticiler
        </h2>
        <button className="flex items-center gap-2 bg-surface-variant hover:bg-surface text-xs font-bold px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-500 transition-all">
          <UserPlus size={14} />
          Yeni Admin
        </button>
      </div>
      <table className="w-full text-left text-sm">
        <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-background/20">
          <tr>
            <th className="px-6 py-4">E-posta</th>
            <th className="px-6 py-4">Rol</th>
            <th className="px-6 py-4">Durum</th>
            <th className="px-6 py-4 text-right">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-variant">
          {admins?.map((admin: any) => (
            <tr key={admin.id} className="hover:bg-surface-variant/30 transition-colors group">
              <td className="px-6 py-4 font-medium text-slate-200">{admin.email}</td>
              <td className="px-6 py-4">
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                  admin.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {admin.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-correct' : 'bg-wrong'}`} />
                  <span className="text-xs text-slate-400">{admin.isActive ? 'Aktif' : 'Pasif'}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => window.confirm('Bu admini silmek istediğinize emin misiniz?') && onDelete(admin.id)}
                  className="p-2 text-slate-500 hover:text-wrong transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
