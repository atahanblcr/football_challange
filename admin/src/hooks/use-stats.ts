import { useQuery } from '@tanstack/react-query';
import { api } from '@/config/api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/admin/stats/dashboard').then(r => r.data.data),
    refetchInterval: 60_000, // 1 dakikada bir yenile
  });
}

export function useDetailedStats(filters: any) {
  return useQuery({
    queryKey: ['detailed-stats', filters],
    queryFn: () => api.get('/admin/stats/detailed', { params: filters }).then(r => r.data.data),
  });
}
