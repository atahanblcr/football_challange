// src/components/dashboard/PoolHealthWidget.tsx
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface PoolItem {
  module: string;
  count: number;
  label: string;
}

interface Props { data: PoolItem[] }

const DANGER_THRESHOLD  = 5;
const WARNING_THRESHOLD = 7;

export function PoolHealthWidget({ data }: Props) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-variant shadow-lg">
      <h2 className="text-sm font-semibold text-slate-300 mb-4">📦 Soru Havuzu Sağlığı</h2>
      <div className="space-y-4">
        {data.map((item) => {
          const isDanger  = item.count <= DANGER_THRESHOLD;
          const isWarning = item.count <= WARNING_THRESHOLD && !isDanger;

          return (
            <div key={item.module} className="flex items-center gap-3">
              <span className="text-sm w-36 text-slate-300">{item.label}</span>

              {/* Progress bar */}
              <div className="flex-1 h-2 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (item.count / 30) * 100)}%` }}
                />
              </div>

              <span className={`text-xs font-medium w-16 text-right ${
                isDanger ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {item.count} soru
              </span>

              {isDanger
                ? <AlertCircle size={16} className="text-red-400" />
                : isWarning
                ? <AlertTriangle size={16} className="text-yellow-400" />
                : <CheckCircle size={16} className="text-green-400" />
              }
            </div>
          );
        })}
        {data.length === 0 && (
          <p className="text-xs text-slate-500 italic text-center py-2">Henüz modül verisi yok.</p>
        )}
      </div>
    </div>
  );
}
