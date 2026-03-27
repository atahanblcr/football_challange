import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import toast from 'react-hot-toast';

export function useEntities(filters: any) {
  return useQuery({
    queryKey: ['entities', filters],
    queryFn: () => api.get('/admin/entities', { params: filters }).then(r => r.data.data),
  });
}

export function useEntity(id: string) {
  return useQuery({
    queryKey: ['entities', id],
    queryFn: () => api.get(`/admin/entities/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/admin/entities', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity başarıyla oluşturuldu');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Entity oluşturulurken hata oluştu');
    },
  });
}

export function useUpdateEntity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/admin/entities/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      queryClient.invalidateQueries({ queryKey: ['entities', id] });
      toast.success('Entity güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Güncelleme hatası');
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/entities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      toast.success('Entity silindi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Silme hatası');
    },
  });
}
