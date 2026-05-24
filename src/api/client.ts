export const API_URL = '/api';

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  const text = await response.text();
  let data: { message?: string; data?: unknown };
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      'Server returned invalid JSON. Is the PHP backend running on http://localhost:8000?'
    );
  }

  if (!text) {
    throw new Error(
      'Empty response from server. Start the PHP backend (run start-backend.bat or start-all.bat).'
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Auto logout on unauthorized
      localStorage.removeItem('fp_token');
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error(data.message || 'API request failed');
  }

  return data.data as T;
}
