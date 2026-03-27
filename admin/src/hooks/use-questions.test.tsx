import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQuestions, useCreateQuestion } from './use-questions';
import { api } from '@/config/api';
import React from 'react';

// Mock API
vi.mock('@/config/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useQuestions hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useQuestions should fetch data', async () => {
    const mockData = { items: [{ id: '1', title: 'Test Q' }], meta: {} };
    (api.get as any).mockResolvedValue({ data: { data: mockData } });

    const { result } = renderHook(() => useQuestions({ module: 'players' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/admin/questions', { params: { module: 'players' } });
  });

  it('useCreateQuestion should call api and invalidate queries', async () => {
    const mockPayload = { title: 'New Q' };
    (api.post as any).mockResolvedValue({ data: { data: { id: '2' } } });

    const { result } = renderHook(() => useCreateQuestion(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(mockPayload);

    expect(api.post).toHaveBeenCalledWith('/admin/questions', mockPayload);
  });
});
