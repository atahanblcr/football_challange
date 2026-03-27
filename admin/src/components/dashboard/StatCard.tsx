// src/components/dashboard/StatCard.tsx
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  colorClass?: string;
}

export function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  description,
  colorClass = 'text-white'
}: StatCardProps) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-surface-variant shadow-lg hover:border-slate-500 transition-colors">
      <div className="flex items-center gap-2 text-slate-400 text-xs mb-3 uppercase tracking-wider font-semibold">
        <Icon size={14} className="text-primary" />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        {description && (
          <span className="text-xs text-slate-500">{description}</span>
        )}
      </div>
    </div>
  );
}
