import { useSession } from '@/stores/session';

const BASE = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

// Concurrent 401s must not each fire their own refresh — coalesce into
// the one in-flight attempt.
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await useSession.getState().getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const body = await res.json();
      await useSession.getState().setSession(body.data);
      return true;
    } catch {
      await useSession.getState().clearSession();
      return false;
    }
  })();
  const result = await refreshPromise;
  refreshPromise = null;
  return result;
}

async function rawRequest(path: string, init: RequestInit = {}, retry = true): Promise<any> {
  if (!BASE) throw new Error('EXPO_PUBLIC_API_URL is not set (apps/mobile/.env)');
  const token = useSession.getState().accessToken;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry) {
    const ok = await refreshSession();
    if (ok) return rawRequest(path, init, false);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message);
  }
  return body;
}

/** Unwraps `{ data }` — every non-paginated endpoint. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await rawRequest(path, init);
  return body.data as T;
}

/** Keeps `nextCursor` alongside `data` — the paginated list endpoints. */
export async function requestPage<T>(path: string, init?: RequestInit): Promise<{ data: T[]; nextCursor: string | null }> {
  const body = await rawRequest(path, init);
  return { data: body.data, nextCursor: body.nextCursor ?? null };
}
