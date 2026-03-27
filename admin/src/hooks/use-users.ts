import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import toast from 'react-hot-toast';

export function useUsers(filters: any) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => api.get('/admin/users', { params: filters }).then(r => r.data.data),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api.get(`/admin/users/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      api.post(`/admin/users/${id}/ban`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı banlandı');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ban hatası');
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/unban`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Kullanıcı banı kaldırıldı');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İşlem başarısız');
    },
  });
}
