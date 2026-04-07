// src/hooks/use-questions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/config/api';
import toast from 'react-hot-toast';

// Liste
export function useQuestions(filters: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['questions', filters],
    queryFn: () =>
      api.get('/admin/questions', { params: filters }).then(r => r.data.data),
  });
}

// Tek kayıt
export function useQuestion(id: string) {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () =>
      api.get(`/admin/questions/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

// Oluştur
export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.post('/admin/questions', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Soru oluşturuldu');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Hata oluştu');
    },
  });
}

// Güncelle
export function useUpdateQuestion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.patch(`/admin/questions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      qc.invalidateQueries({ queryKey: ['question', id] });
      toast.success('Soru güncellendi');
    },
  });
}

// Arşivle (soft)
export function useArchiveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/admin/questions/${id}/archive`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Soru arşivleniyor...');
    },
  });
}

// Atamalar
export function useAssignmentsByDate(date: string) {
  return useQuery({
    queryKey: ['assignments', date],
    queryFn: () => api.get('/admin/questions/assignments/day', { params: { date } }).then(r => r.data.data),
    enabled: !!date,
  });
}

export function useTriggerAssignments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/admin/questions/assignments/trigger'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions-calendar'] });
      toast.success('Soru atamaları tetiklendi');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Atama hatası oluştu');
    },
  });
}

export function useAssignManual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; module: string; questionId: string; isSpecial?: boolean }) => 
      api.post('/admin/questions/assignments/assign', data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['questions-calendar'] });
      qc.invalidateQueries({ queryKey: ['assignments', variables.date] });
      toast.success('Soru atandı');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Atama hatası oluştu');
    },
  });
}

export function useAssignRandom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; module: string; isSpecial?: boolean }) => 
      api.post('/admin/questions/assignments/randomize', data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['questions-calendar'] });
      qc.invalidateQueries({ queryKey: ['assignments', variables.date] });
      toast.success('Rastgele soru atandı');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Rastgele atama hatası oluştu');
    },
  });
}
