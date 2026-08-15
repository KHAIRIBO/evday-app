// expo/fetch (not the global fetch) supports streaming response bodies on
// device — see architecture.md's "AI streaming" section.
// eslint-disable-next-line no-restricted-imports
import { fetch as expoFetch } from 'expo/fetch';

import { useSession } from '@/stores/session';

const BASE = process.env.EXPO_PUBLIC_API_URL;

/**
 * Streams one assistant reply token-by-token, calling onToken per chunk.
 * No 401-retry here (unlike client.ts) — streaming responses can't be
 * transparently replayed the way a JSON request can. If the access token
 * is already known to be missing, the caller should refresh first (the
 * assistant screen does, via ensureFreshAccessToken below).
 */
export async function streamAssistantMessage(
  conversationId: string,
  message: string,
  attachments: string[] | undefined,
  onToken: (text: string) => void,
): Promise<void> {
  if (!BASE) throw new Error('EXPO_PUBLIC_API_URL is not set (apps/mobile/.env)');
  const token = useSession.getState().accessToken;

  const res = await expoFetch(`${BASE}/api/assistant/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, attachments }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`Assistant request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') return;
      try {
        const json = JSON.parse(payload);
        if (typeof json.text === 'string') onToken(json.text);
        if (json.error) throw new Error(json.error);
      } catch (e) {
        if (e instanceof Error && e.message !== payload) throw e; // real error, not a JSON.parse hiccup
      }
    }
  }
}

/** Call before streaming if there's a chance the 15-min access token has expired. */
export async function ensureFreshAccessToken(): Promise<void> {
  if (useSession.getState().accessToken) return;
  const refreshToken = await useSession.getState().getRefreshToken();
  if (!refreshToken) throw new Error('Not signed in');

  const res = await fetch(`${BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Session expired — please sign in again');
  const body = await res.json();
  await useSession.getState().setSession(body.data);
}
