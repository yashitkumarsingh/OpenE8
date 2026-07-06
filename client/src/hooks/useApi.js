import { useState } from 'react';

export function useApi(initialToken, onSessionExpired) {
  const [token, setToken] = useState(initialToken || '');

  const apiFetch = async (url, options = {}) => {
    const headers = options.headers ? { ...options.headers } : {};
    const storedToken = localStorage.getItem('opene8_token') || token;
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
    if (!(options.body instanceof FormData) && typeof options.body === 'object') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      localStorage.removeItem('opene8_token');
      localStorage.removeItem('opene8_user');
      setToken('');
      if (onSessionExpired) {
        onSessionExpired();
      }
      throw new Error('Session expired. Please log in.');
    }
    return res;
  };

  return { token, setToken, apiFetch };
}
