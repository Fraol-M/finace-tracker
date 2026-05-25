export const API_URL = '/api';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('fp_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (err) {
    const snippet = raw ? raw.slice(0, 200) : 'Empty response body';
    throw new Error(`API returned non-JSON response (${response.status}): ${snippet}`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Auto logout on unauthorized
      localStorage.removeItem('fp_token');
      localStorage.removeItem('fp_current_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(data.message || 'API request failed');
  }

  return data.data;
}
