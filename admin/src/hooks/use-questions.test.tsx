import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  useQuestions, useCreateQuestion, useAssignmentsByDate, 
  useTriggerAssignments, useAssignManual, useAssignRandom 
} from './use-questions';
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

  it('useAssignmentsByDate should fetch assignments for a day', async () => {
    const mockData = [{ id: 'a1', question: { title: 'Q1' } }];
    (api.get as any).mockResolvedValue({ data: { data: mockData } });

    const { result } = renderHook(() => useAssignmentsByDate('2026-04-06'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/admin/questions/assignments/day', { params: { date: '2026-04-06' } });
  });

  it('useTriggerAssignments should call trigger endpoint', async () => {
    (api.post as any).mockResolvedValue({ data: { status: 'success' } });

    const { result } = renderHook(() => useTriggerAssignments(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync();

    expect(api.post).toHaveBeenCalledWith('/admin/questions/assignments/trigger');
  });

  it('useAssignManual should call assign endpoint', async () => {
    const mockPayload = { date: '2026-04-06', module: 'players', questionId: 'q1' };
    (api.post as any).mockResolvedValue({ data: { status: 'success' } });

    const { result } = renderHook(() => useAssignManual(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(mockPayload);

    expect(api.post).toHaveBeenCalledWith('/admin/questions/assignments/assign', mockPayload);
  });

  it('useAssignRandom should call randomize endpoint', async () => {
    const mockPayload = { date: '2026-04-06', module: 'players' };
    (api.post as any).mockResolvedValue({ data: { status: 'success' } });

    const { result } = renderHook(() => useAssignRandom(), {
      wrapper: createWrapper(),
    });

    await result.current.mutateAsync(mockPayload);

    expect(api.post).toHaveBeenCalledWith('/admin/questions/assignments/randomize', mockPayload);
  });
});
