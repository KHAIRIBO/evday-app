import { ApiError } from './errors';
import { admin } from './supabase-admin';

export async function assertOwnsConversation(profileId: string, conversationId: string) {
  const { data, error } = await admin
    .from('ai_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', profileId)
    .maybeSingle();
  if (error) throw new ApiError(500, 'DB_ERROR', error.message);
  if (!data) throw new ApiError(404, 'NOT_FOUND', 'Conversation not found');
}

const MAX_CONTEXT_CHARS = 8000;

/**
 * Pulls OCR text for any attached files into a single context string for
 * the AI provider. Only attachments the requesting user actually owns are
 * included — an attachment id for someone else's file is silently
 * dropped, not an error, since it just means less context, not a security
 * hole (workspace_files is still scoped by user_id in the query below).
 */
export async function gatherContext(profileId: string, attachments?: string[]): Promise<string | undefined> {
  if (!attachments?.length) return undefined;

  const { data: files, error } = await admin
    .from('workspace_files')
    .select('id, name, ocr_results(extracted_text)')
    .in('id', attachments)
    .eq('user_id', profileId);
  if (error) throw new ApiError(500, 'DB_ERROR', error.message);
  if (!files?.length) return undefined;

  let context = '';
  for (const file of files) {
    const ocr = Array.isArray(file.ocr_results) ? file.ocr_results[0] : file.ocr_results;
    const text = (ocr as { extracted_text: string | null } | null)?.extracted_text;
    if (!text) continue;
    context += `--- ${file.name} ---\n${text}\n\n`;
    if (context.length >= MAX_CONTEXT_CHARS) break;
  }

  return context.slice(0, MAX_CONTEXT_CHARS) || undefined;
}

/**
 * Wraps an AI provider's SSE ReadableStream to also accumulate the full
 * text and persist it once the stream ends — bytes pass through to the
 * client unchanged and immediately, the DB write happens in the
 * transform's flush(), after the response has already been sent.
 */
export function withPersistence(source: ReadableStream, onDone: (fullText: string) => Promise<void>): ReadableStream {
  let full = '';
  const decoder = new TextDecoder();

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const obj = JSON.parse(payload);
          if (typeof obj.text === 'string') full += obj.text;
        } catch {
          // not a JSON data line — ignore
        }
      }
      controller.enqueue(chunk);
    },
    async flush() {
      await onDone(full);
    },
  });

  return source.pipeThrough(transform);
}
