import Anthropic from '@anthropic-ai/sdk';

import type { AIProvider } from './index';

// claude-sonnet-5 — see AGENTS.md/CLAUDE.md for the current model roster;
// always default new integrations to the latest Claude family rather than
// an older pinned snapshot.
const MODEL = 'claude-sonnet-5';
const MAX_TOKENS = 1024;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async stream({ message, context }: { message: string; context?: string }): Promise<ReadableStream> {
    const events = this.client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: context ? `Use the following context to answer the user's question:\n\n${context}` : undefined,
      messages: [{ role: 'user', content: message }],
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
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
    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: context ? `Use the following context to answer the user's question:\n\n${context}` : undefined,
      messages: [{ role: 'user', content: message }],
    });
    const block = response.content.find((b) => b.type === 'text');
    return block?.type === 'text' ? block.text : '';
  }
}

const OCR_PROMPT =
  'Extract all text visible in this image. Return only the extracted text, preserving line breaks and structure where meaningful. Respond with an empty string if there is no text.';

/**
 * Not part of AIProvider — OCR is Anthropic-vision-specific and there's no
 * OpenAI/Gemini implementation to abstract against yet. Used directly by
 * app/api/ocr/process/route.ts. Takes a signed URL rather than fetching
 * and base64-encoding the image itself — one fewer network hop, and the
 * Messages API supports image blocks with a `url` source directly.
 */
export async function extractTextFromImage(apiKey: string, imageUrl: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          { type: 'text', text: OCR_PROMPT },
        ],
      },
    ],
  });
  const block = response.content.find((b) => b.type === 'text');
  return block?.type === 'text' ? block.text.trim() : '';
}
