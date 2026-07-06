import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

describe('useApi Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(global, 'fetch');
  });

  it('initializes token from argument', () => {
    const { result } = renderHook(() => useApi('init-token'));
    expect(result.current.token).toBe('init-token');
  });

  it('sets authentication headers correctly on apiFetch request', async () => {
    global.fetch.mockImplementation(() => Promise.resolve({
      status: 200,
      json: () => Promise.resolve({ success: true })
    }));

    const { result } = renderHook(() => useApi('mock-token'));
    await result.current.apiFetch('/api/test-endpoint');

    expect(global.fetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer mock-token'
      })
    }));
  });

  it('triggers onSessionExpired callback when backend returns 401 Unauthorized', async () => {
    global.fetch.mockImplementation(() => Promise.resolve({
      status: 401
    }));

    const onSessionExpired = vi.fn();
    const { result } = renderHook(() => useApi('mock-token', onSessionExpired));

    await expect(result.current.apiFetch('/api/test-endpoint')).rejects.toThrow('Session expired. Please log in.');
    expect(onSessionExpired).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.token).toBe('');
    });
  });
});
