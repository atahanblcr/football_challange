// src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';
import { formatNumber } from '@/lib/utils';
import { AlertTriangle, Users, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { PoolHealthWidget } from '@/components/dashboard/PoolHealthWidget';
import { ActiveQuestionsTable } from '@/components/dashboard/ActiveQuestionsTable';
import { StatCard } from '@/components/dashboard/StatCard';

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/stats/dashboard').then(r => r.data.data),
    refetchInterval: 30_000, // 30 saniyede bir yenile
  });

  if (isLoading) return <DashboardSkeleton />;

  const stats = data?.today ?? {};
  const pool = data?.poolHealth ?? [];
  const suspiciousCount = data?.suspiciousCount ?? 0;

  return (
    <div className="p-6 space-y-6 bg-background min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Sistemin genel durumuna ve günlük metriklerine göz atın.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface px-4 py-2 rounded-lg border border-surface-variant text-slate-300">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-medium">
            {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Metrik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users}         
          label="Aktif Kullanıcı"  
          value={formatNumber(stats.activeUsers ?? 0)}  
          description="Son 7 gün"
        />
        <StatCard 
          icon={CheckCircle}   
          label="Çözülen Oturum"  
          value={formatNumber(stats.sessions ?? 0)}     
          description="Bugün"
          colorClass="text-correct"
        />
        <StatCard 
          icon={TrendingUp}    
          label="Tamamlama Oranı" 
          value={`${stats.completionRate ?? 0}%`}       
          description="submitted / started"
          colorClass="text-primary"
        />
        <StatCard 
          icon={TrendingUp}    
          label="Ort. Puan/Soru"  
          value={(stats.avgScore ?? 0).toFixed(1)}      
          description="Bugün ortalaması"
        />
      </div>

      {/* Şüpheli oturum uyarısı */}
      {suspiciousCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <AlertTriangle size={24} className="text-yellow-400 shrink-0" />
          <div>
            <span className="text-sm text-yellow-300 font-semibold block">
              Bugün {suspiciousCount} şüpheli oturum tespit edildi.
            </span>
            <p className="text-xs text-yellow-500/80">Lütfen hile tespiti sistemindeki verileri inceleyin ve gerekirse kullanıcıları banlayın.</p>
          </div>
          <a href="/users?filter=suspicious" className="ml-auto bg-yellow-500 text-background text-xs font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors">
            Hemen İncele
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Havuz sağlığı */}
        <PoolHealthWidget data={pool} />
        
        {/* Bugün aktif sorular */}
        <ActiveQuestionsTable />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="h-10 w-40 bg-surface rounded" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-surface rounded-xl border border-surface-variant" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-surface rounded-xl border border-surface-variant" />
        <div className="h-64 bg-surface rounded-xl border border-surface-variant" />
      </div>
    </div>
  );
}
