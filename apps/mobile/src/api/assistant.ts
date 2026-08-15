import type { ConversationRecordT, MessageRecordT } from '@workspace/shared/schema';

import { request } from './client';

export const assistantApi = {
  listConversations: () => request<ConversationRecordT[]>('/api/assistant/conversations'),
  createConversation: (title?: string) =>
    request<ConversationRecordT>('/api/assistant/conversations', { method: 'POST', body: JSON.stringify({ title }) }),
  listMessages: (conversationId: string) =>
    request<MessageRecordT[]>(`/api/assistant/conversations/${conversationId}/messages`),
};
