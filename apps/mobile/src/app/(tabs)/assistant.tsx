import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { assistantApi } from '@/api/assistant';
import { ensureFreshAccessToken, streamAssistantMessage } from '@/api/assistant-stream';
import { notesApi } from '@/api/notes';
import { IconArrowLeft, IconMoreVertical, IconPaperclip, IconSend } from '@/components/icon';
import { ChatActionChip, ChatBubble, ChatFileChip } from '@/components/ui/chat-bubble';
import { IconButton } from '@/components/ui/icon-button';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { pickDocument, type PickedAsset } from '@/features/upload';
import { uploadFile } from '@/api/files';
import type { MessageRecordT } from '@workspace/shared/schema';

type LiveMessage = MessageRecordT & { streaming?: boolean };

export default function AssistantScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const conversations = useQuery({ queryKey: ['assistant', 'conversations'], queryFn: assistantApi.listConversations });
  const [conversationId, setConversationId] = useState<string | null>(null);

  // No conversation-switching UI yet (Phase 1) — use the most recent one,
  // creating it on first ever open.
  useEffect(() => {
    if (conversationId || !conversations.data) return;
    if (conversations.data.length > 0) {
      setConversationId(conversations.data[0].id);
      return;
    }
    assistantApi.createConversation().then((c) => {
      qc.invalidateQueries({ queryKey: ['assistant', 'conversations'] });
      setConversationId(c.id);
    });
  }, [conversations.data, conversationId, qc]);

  const messagesQuery = useQuery({
    queryKey: ['assistant', 'messages', conversationId],
    queryFn: () => assistantApi.listMessages(conversationId!),
    enabled: Boolean(conversationId),
  });

  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{ id: string; name: string; size: number } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (messagesQuery.data) setLiveMessages(messagesQuery.data);
  }, [messagesQuery.data]);

  async function send() {
    const text = input.trim();
    if (!text || !conversationId || sending) return;

    const userMsg: LiveMessage = {
      id: `local-${Date.now()}`,
      conversationId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    const attachments = pendingAttachment ? [pendingAttachment.id] : undefined;
    setInput('');
    setPendingAttachment(null);
    setLiveMessages((m) => [...m, userMsg]);
    setSending(true);

    const assistantMsgId = `local-${Date.now() + 1}`;
    setLiveMessages((m) => [
      ...m,
      { id: assistantMsgId, conversationId, role: 'assistant', content: '', createdAt: new Date().toISOString(), streaming: true },
    ]);

    try {
      await ensureFreshAccessToken();
      let full = '';
      await streamAssistantMessage(conversationId, text, attachments, (token) => {
        full += token;
        setLiveMessages((m) => m.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: full } : msg)));
      });
      setLiveMessages((m) => m.map((msg) => (msg.id === assistantMsgId ? { ...msg, streaming: false } : msg)));
    } catch (e) {
      setLiveMessages((m) =>
        m.map((msg) =>
          msg.id === assistantMsgId
            ? { ...msg, streaming: false, content: `⚠️ ${e instanceof Error ? e.message : 'Request failed'}` }
            : msg,
        ),
      );
    } finally {
      setSending(false);
      qc.invalidateQueries({ queryKey: ['assistant', 'messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    }
  }

  async function attachFile() {
    try {
      const asset: PickedAsset | null = await pickDocument();
      if (!asset) return;
      const uploaded = await uploadFile(asset.uri, asset.name, asset.mimeType, null);
      setPendingAttachment({ id: uploaded.id, name: uploaded.name, size: uploaded.size });
    } catch (e) {
      Alert.alert('Attachment failed', e instanceof Error ? e.message : 'Could not attach file');
    }
  }

  async function copyResponse(text: string) {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Response copied to clipboard.');
  }

  async function saveAsNote(text: string) {
    try {
      await notesApi.create({ title: 'From Assistant', content: text });
      qc.invalidateQueries({ queryKey: ['notes'] });
      Alert.alert('Saved', 'Added to your notes.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Try again');
    }
  }

  async function exportResponse(text: string) {
    try {
      const path = `${FileSystem.cacheDirectory}assistant-response-${Date.now()}.txt`;
      await FileSystem.writeAsStringAsync(path, text);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert('Export unavailable', 'This device can’t open the share sheet.');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Try again');
    }
  }

  const lastAssistantMessage = [...liveMessages].reverse().find((m) => m.role === 'assistant' && !m.streaming && m.content);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <IconArrowLeft size={19} />
        </IconButton>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Assistant</Text>
          <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
        </View>
        <IconButton>
          <IconMoreVertical size={18} color={Colors.text} />
        </IconButton>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {messagesQuery.isLoading || !conversationId ? (
          <View style={[styles.flex, styles.center]}>
            <ActivityIndicator color={Colors.lime} />
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {liveMessages.length === 0 && (
              <Text style={styles.emptyText}>Ask about your files, or attach one and ask a question.</Text>
            )}
            {liveMessages.map((m) => (
              <ChatBubble key={m.id} from={m.role === 'assistant' ? 'ai' : 'me'}>
                {m.content || (m.streaming ? '…' : '')}
              </ChatBubble>
            ))}
            {lastAssistantMessage && (
              <View style={styles.actionRow}>
                <ChatActionChip label="Save as note" accent onPress={() => saveAsNote(lastAssistantMessage.content ?? '')} />
                <ChatActionChip label="Export" onPress={() => exportResponse(lastAssistantMessage.content ?? '')} />
                <ChatActionChip label="Copy" onPress={() => copyResponse(lastAssistantMessage.content ?? '')} />
              </View>
            )}
          </ScrollView>
        )}

        {pendingAttachment && (
          <View style={styles.attachmentRow}>
            <ChatFileChip name={pendingAttachment.name} size={`${(pendingAttachment.size / 1024).toFixed(0)} KB`} />
          </View>
        )}

        <View style={styles.composer}>
          <IconButton onPress={attachFile}>
            <IconPaperclip size={18} />
          </IconButton>
          <TextInput
            style={styles.input}
            placeholder="Ask about your files..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!sending}
          />
          <IconButton accent onPress={send}>
            <IconSend size={18} />
          </IconButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three - 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: Colors.textFaint,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.four - 6,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: Spacing.three,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.six,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 7,
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
  },
  attachmentRow: {
    paddingHorizontal: Spacing.four - 6,
    paddingBottom: 6,
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  input: {
    flex: 1,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: Radii.lg - 1,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 12.5,
  },
});
