import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuth } from './use-auth';
import { api } from '@/config/api';

// Mock the API
vi.mock('@/config/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('useAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset Zustand store state
    useAuth.setState({ admin: null, isLoading: true });
  });

  it('should initialize with null admin and loading true', () => {
    const state = useAuth.getState();
    expect(state.admin).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('should set admin on successful login', async () => {
    const mockAdmin = { id: '1', email: 'test@admin.com', role: 'super_admin' };
    const mockResponse = {
      data: {
        data: {
          sessionToken: 'test-token',
          admin: mockAdmin,
        },
      },
    };

    (api.post as any).mockResolvedValue(mockResponse);

    await useAuth.getState().login('test@admin.com', 'password');

    expect(localStorage.getItem('admin_session')).toBe('test-token');
    expect(useAuth.getState().admin).toEqual(mockAdmin);
  });

  it('should clear admin on logout', async () => {
    // Manually set initial state for test
    useAuth.setState({ admin: { id: '1', email: 'test@admin.com', role: 'super_admin' } });
    localStorage.setItem('admin_session', 'test-token');

    // Mock window.location.href (Zustand store uses it)
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' } as any;

    (api.post as any).mockResolvedValue({});

    await useAuth.getState().logout();

    expect(localStorage.getItem('admin_session')).toBeNull();
    expect(useAuth.getState().admin).toBeNull();
    expect(window.location.href).toBe('/login');

    // Restore location
    window.location = originalLocation as any;
  });

  it('should set admin on successful checkSession', async () => {
    const mockAdmin = { id: '1', email: 'test@admin.com', role: 'editor' };
    (api.get as any).mockResolvedValue({ data: { data: mockAdmin } });

    await useAuth.getState().checkSession();

    expect(useAuth.getState().admin).toEqual(mockAdmin);
    expect(useAuth.getState().isLoading).toBe(false);
  });

  it('should set admin to null on failed checkSession', async () => {
    (api.get as any).mockRejectedValue(new Error('Unauthorized'));

    await useAuth.getState().checkSession();

    expect(useAuth.getState().admin).toBeNull();
    expect(useAuth.getState().isLoading).toBe(false);
  });
});
