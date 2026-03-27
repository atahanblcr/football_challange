import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell,
  PieChart, Pie
} from 'recharts';
import { Loader2, TrendingUp, Users, CheckCircle, Award } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function StatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats-detailed'],
    queryFn: () => api.get('/admin/stats/dashboard').then(r => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const { today, poolHealth } = data;

  // Mock data for charts (Backend should provide historical data in a real scenario)
  const activityData = [
    { name: 'Pzt', users: 400, sessions: 240 },
    { name: 'Sal', users: 300, sessions: 139 },
    { name: 'Çar', users: 200, sessions: 980 },
    { name: 'Per', users: 278, sessions: 390 },
    { name: 'Cum', users: 189, sessions: 480 },
    { name: 'Cmt', users: 239, sessions: 380 },
    { name: 'Paz', users: 349, sessions: 430 },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Detaylı İstatistikler</h1>
        <p className="text-sm text-slate-500 mt-1">Sistem performansı ve kullanıcı etkileşimlerini analiz edin.</p>
      </div>

      {/* Üst Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-surface-variant shadow-lg">
          <div className="flex items-center gap-3 text-slate-400 text-xs mb-3 font-bold uppercase">
            <Users size={16} className="text-primary" />
            Aktif Kullanıcı (7G)
          </div>
          <p className="text-3xl font-bold text-white">{formatNumber(today.activeUsers || 0)}</p>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-surface-variant shadow-lg">
          <div className="flex items-center gap-3 text-slate-400 text-xs mb-3 font-bold uppercase">
            <CheckCircle size={16} className="text-correct" />
            Bugün Çözülen
          </div>
          <p className="text-3xl font-bold text-white">{formatNumber(today.sessions || 0)}</p>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-surface-variant shadow-lg">
          <div className="flex items-center gap-3 text-slate-400 text-xs mb-3 font-bold uppercase">
            <TrendingUp size={16} className="text-warning" />
            Tamamlama Oranı
          </div>
          <p className="text-3xl font-bold text-white">%{today.completionRate || 0}</p>
        </div>
        <div className="bg-surface p-5 rounded-2xl border border-surface-variant shadow-lg">
          <div className="flex items-center gap-3 text-slate-400 text-xs mb-3 font-bold uppercase">
            <Award size={16} className="text-purple-400" />
            Ort. Puan/Soru
          </div>
          <p className="text-3xl font-bold text-white">{(today.avgScore || 0).toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kullanıcı Aktivitesi Grafiği */}
        <div className="bg-surface p-6 rounded-2xl border border-surface-variant shadow-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Kullanıcı Aktivitesi (Haftalık)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="users" stroke="#1A56DB" strokeWidth={3} dot={{ r: 4, fill: '#1A56DB' }} activeDot={{ r: 6 }} name="Aktif Kullanıcı" />
                <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} name="Oturumlar" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modül Bazlı Dağılım */}
        <div className="bg-surface p-6 rounded-2xl border border-surface-variant shadow-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Soru Havuzu Dağılımı</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={poolHealth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Soru Sayısı">
                  {poolHealth.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.count < 7 ? '#EF4444' : '#1A56DB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
