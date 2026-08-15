import { MessageRecord, SendMessageInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { logActivity } from '@/lib/activity';
import { assertOwnsConversation, gatherContext, withPersistence } from '@/lib/assistant';
import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse, validationError } from '@/lib/errors';
import { getProfileId } from '@/lib/profile';
import { checkRateLimit } from '@/lib/rate-limit';
import { admin } from '@/lib/supabase-admin';
import { getAIProvider } from '@/providers/ai';

// architecture.md suggests `export const runtime = 'edge'` here for
// token-by-token streaming, but @anthropic-ai/sdk isn't actually
// edge-compatible — its credentials module touches node:fs/node:path,
// which fails the edge bundle outright. Streaming works identically on
// the Node.js runtime (default here); the only thing lost is edge's
// lower cold-start latency, not any functionality. lib/auth.ts still
// stays free of node:crypto regardless, in case a future edge-safe
// provider makes it worth revisiting.

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const { id: conversationId } = await params;
    await assertOwnsConversation(profileId, conversationId);

    const { data, error } = await admin
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    return NextResponse.json({
      data: data.map((row) =>
        MessageRecord.parse({
          id: row.id,
          conversationId: row.conversation_id,
          role: row.role,
          content: row.content,
          createdAt: row.created_at,
        }),
      ),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const profileId = await getProfileId(user.id);
    const { id: conversationId } = await params;
    await assertOwnsConversation(profileId, conversationId);

    const parsed = SendMessageInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const { message, attachments } = parsed.data;

    const allowed = await checkRateLimit(profileId, 'assistant');
    if (!allowed) throw new ApiError(429, 'RATE_LIMITED', 'Assistant rate limit exceeded — try again later');

    const { error: insertErr } = await admin
      .from('ai_messages')
      .insert({ conversation_id: conversationId, role: 'user', content: message });
    if (insertErr) throw new ApiError(500, 'DB_ERROR', insertErr.message);

    const context = await gatherContext(profileId, attachments);
    const provider = getAIProvider();
    const rawStream = await provider.stream({ message, context });

    const stream = withPersistence(rawStream, async (fullText) => {
      await admin.from('ai_messages').insert({ conversation_id: conversationId, role: 'assistant', content: fullText });
      await admin.from('ai_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
      await logActivity(profileId, 'assistant_reply', 'assistant', conversationId);
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
