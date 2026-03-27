import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuestionEdit } from './QuestionEdit';
import { api } from '@/config/api';
import React from 'react';

// Mock API
vi.mock('@/config/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/questions/1/edit']}>
        <Routes>
          <Route path="/questions/:id/edit" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QuestionEdit Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load question data and render form', async () => {
    const mockQuestion = {
      id: '1',
      title: 'Test Edit Question',
      module: 'players',
      difficulty: 'medium',
      basePoints: 100,
      timeLimit: 60,
      status: 'active',
      answers: [
        { 
          entityId: 'e1', 
          rank: 1, 
          statValue: '10', 
          entity: { name: 'Player 1', countryCode: 'TR' } 
        }
      ],
    };

    (api.get as any).mockResolvedValue({ data: { data: mockQuestion } });

    render(<QuestionEdit />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Edit Question')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });
});
