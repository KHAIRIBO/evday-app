import type { AIProvider } from './index';

/**
 * OmniRoute — a self-hosted, OpenAI-compatible AI gateway
 * (POST {baseUrl}/chat/completions, Bearer auth). Not a cloud service: it
 * runs on a machine. OMNIROUTE_BASE_URL defaults to the local instance,
 * which only works while apps/api itself runs on that same machine
 * (`pnpm --filter api dev`) — a deployed Vercel instance can't reach
 * someone's localhost. Point OMNIROUTE_BASE_URL at a public URL/tunnel
 * once this needs to work in production.
 */
export class OmniRouteProvider implements AIProvider {
  constructor(
    private apiKey: string,
    private baseUrl: string,
    private model: string,
  ) {}

  private buildMessages(message: string, context?: string) {
    return [
      ...(context ? [{ role: 'system', content: `Use the following context to answer the user's question:\n\n${context}` }] : []),
      { role: 'user', content: message },
    ];
  }

  private async request(message: string, context: string | undefined, stream: boolean) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.model, stream, messages: this.buildMessages(message, context) }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`OmniRoute request failed (${res.status}): ${body.slice(0, 500)}`);
    }
    return res;
  }

  async stream({ message, context }: { message: string; context?: string }): Promise<ReadableStream> {
    const res = await this.request(message, context, true);
    if (!res.body) throw new Error('OmniRoute response had no body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Re-emits OmniRoute's OpenAI-shaped SSE (choices[0].delta.content) as
    // our own `data: {"text": "..."}` shape — the same one every other
    // provider's stream() produces, so withPersistence() and the client
    // don't need to know which provider answered.
    return new ReadableStream({
      async start(controller) {
        let buffer = '';
        try {
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
              if (payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload);
                const text = json.choices?.[0]?.delta?.content;
                if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              } catch {
                // partial line split across chunks — safe to ignore, it
                // completes (or gets dropped) on the next read
              }
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: (err as Error).message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });
  }

  async complete({ message, context }: { message: string; context?: string }): Promise<string> {
    const res = await this.request(message, context, false);
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? '';
  }
}
