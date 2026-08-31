import { auth } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function getToken(): Promise<string | undefined> {
  const session = await auth();
  return (session as { token?: string } | null)?.token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    const msg = (body as { error?: { message?: string } }).error?.message ?? 'Request failed';
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}
