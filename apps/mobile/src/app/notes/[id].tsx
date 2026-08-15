import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notesApi } from '@/api/notes';
import { ApiError } from '@/api/client';
import { IconArrowLeft, IconMoreVertical } from '@/components/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Colors, Fonts, Spacing } from '@/constants/theme';

type SaveStatus = 'saved' | 'saving' | 'error' | 'offline';

const AUTOSAVE_DELAY_MS = 800;

export default function NoteEditorScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const note = useQuery({ queryKey: ['notes', id], queryFn: () => notesApi.get(id), enabled: Boolean(id) });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<SaveStatus>('saved');
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Seed local state once, when the note first loads — after that, local
  // state is the source of truth (never overwritten by refetches), so
  // typing is never clobbered mid-edit.
  useEffect(() => {
    if (note.data && !loaded.current) {
      setTitle(note.data.title);
      setContent(note.data.content ?? '');
      loaded.current = true;
    }
  }, [note.data]);

  useEffect(() => {
    if (!loaded.current) return;
    setStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await notesApi.update(id, { title: title || 'Untitled Note', content });
        setStatus('saved');
        qc.invalidateQueries({ queryKey: ['notes'], exact: true });
      } catch (e) {
        setStatus(e instanceof ApiError ? 'error' : 'offline');
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  function confirmDelete() {
    Alert.alert('Delete note?', 'This can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await notesApi.remove(id);
          qc.invalidateQueries({ queryKey: ['notes'] });
          router.back();
        },
      },
    ]);
  }

  const statusLabel: Record<SaveStatus, string> = {
    saved: 'Saved',
    saving: 'Saving…',
    error: 'Couldn’t save',
    offline: 'Offline — not saved',
  };

  if (note.isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={Colors.lime} />
      </SafeAreaView>
    );
  }

  if (note.isError) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.errorText}>Couldn’t load this note.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <IconArrowLeft size={19} />
        </IconButton>
        <Text style={[styles.statusText, status === 'saved' && styles.statusSaved]}>{statusLabel[status]}</Text>
        <IconButton onPress={confirmDelete}>
          <IconMoreVertical size={18} color={Colors.text} />
        </IconButton>
      </View>

      <View style={styles.body}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Untitled Note"
          placeholderTextColor="rgba(255,255,255,0.3)"
        />
        <TextInput
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Start writing..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          textAlignVertical="top"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three - 2,
  },
  statusText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textFaint,
  },
  statusSaved: {
    color: Colors.textMuted,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four - 6,
    gap: Spacing.two,
  },
  titleInput: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    color: Colors.text,
    paddingVertical: 4,
  },
  contentInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: Colors.text,
    paddingBottom: Spacing.four,
  },
});
