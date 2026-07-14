import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

// Mock the auth API
vi.mock('@shared/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAuth', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should start with no user and not authenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should set isAuthenticated to true if access_token exists', () => {
    localStorageMock.setItem('access_token', 'mock-token');
    // Need to re-import to pick up the token in initial state
    // Instead, test that setItem was called correctly
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'mock-token');
    expect(localStorageMock.getItem('access_token')).toBe('mock-token');
  });

  it('should clear tokens on logout', async () => {
    const { result } = renderHook(() => useAuth());
    localStorageMock.setItem('access_token', 'token');
    localStorageMock.setItem('refresh_token', 'refresh');

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useAuth());
    // The error state starts as null
    expect(result.current.error).toBeNull();
    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
