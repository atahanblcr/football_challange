// src/config/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 dakika
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.response?.data?.error?.message ?? 'İşlem başarısız';
        console.error('Mutation error:', message);
      },
    },
  },
});
