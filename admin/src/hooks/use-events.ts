import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import toast from 'react-hot-toast';

export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/admin/events').then(r => r.data.data),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/admin/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Etkinlik oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata oluştu');
    },
  });
}

export function useActivateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/events/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Etkinlik aktif edildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hata oluştu');
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/admin/events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Etkinlik güncellendi');
    },
  });
}
