import type { AIProvider } from './index';

/**
 * Shared implementation for any OpenAI-compatible chat-completions gateway
 * (POST {baseUrl}/chat/completions, Bearer auth, choices[0].delta.content
 * SSE shape). OmniRoute and OpenRouter are both just this with a different
 * base URL/key — no reason to duplicate the SSE re-framing logic twice.
 */
export class OpenAICompatibleProvider implements AIProvider {
  constructor(
    private providerName: string,
    private apiKey: string,
    private baseUrl: string,
    private model: string,
    private extraHeaders: Record<string, string> = {},
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
        ...this.extraHeaders,
      },
      body: JSON.stringify({ model: this.model, stream, messages: this.buildMessages(message, context) }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`${this.providerName} request failed (${res.status}): ${body.slice(0, 500)}`);
    }
    return res;
  }

  async stream({ message, context }: { message: string; context?: string }): Promise<ReadableStream> {
    const res = await this.request(message, context, true);
    if (!res.body) throw new Error(`${this.providerName} response had no body`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Re-emits the gateway's OpenAI-shaped SSE (choices[0].delta.content) as
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
