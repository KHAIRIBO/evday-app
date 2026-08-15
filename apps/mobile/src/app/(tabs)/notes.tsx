import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { notesApi } from '@/api/notes';
import { IconPencil, IconPlus, IconSearch } from '@/components/icon';
import { FilterChip } from '@/components/ui/filter-chip';
import { IconButton } from '@/components/ui/icon-button';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { NoteRecordT } from '@workspace/shared/schema';

const FILTERS = ['All', 'Pinned'];

function wordCount(text: string | null) {
  return text?.trim() ? text.trim().split(/\s+/).length : 0;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  if (d.toDateString() === today) return `Edited ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  if (d.toDateString() === yesterday) return 'Edited yesterday';
  return `Edited ${d.toLocaleDateString()}`;
}

export default function NotesScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  const notes = useQuery({ queryKey: ['notes'], queryFn: () => notesApi.list() });

  const createNote = useMutation({
    mutationFn: () => notesApi.create({ title: 'Untitled Note' }),
    onSuccess: (note) => {
      qc.invalidateQueries({ queryKey: ['notes'] });
      router.push({ pathname: '/notes/[id]', params: { id: note.id } });
    },
  });

  const visible = useMemo(() => {
    let list = notes.data?.data ?? [];
    if (filter === 'Pinned') list = list.filter((n) => n.isPinned);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((n) => n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q));
    }
    return list;
  }, [notes.data, filter, search]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notes</Text>
          <Text style={styles.subtitle}>{notes.data ? `${notes.data.data.length} notes` : ' '}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton onPress={() => setSearchOpen((s) => !s)}>
            <IconSearch size={18} />
          </IconButton>
          <IconButton accent onPress={() => createNote.mutate()} disabled={createNote.isPending}>
            <IconPlus size={18} />
          </IconButton>
        </View>
      </View>

      {searchOpen && (
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoFocus
          />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={notes.isFetching} onRefresh={() => notes.refetch()} tintColor={Colors.lime} />}>
        <View style={styles.chips}>
          {FILTERS.map((f) => (
            <FilterChip key={f} label={f} active={f === filter} onPress={() => setFilter(f)} />
          ))}
        </View>

        <View>
          <SectionHeader title="All notes" />
          {notes.isLoading ? (
            <ActivityIndicator color={Colors.lime} />
          ) : notes.isError ? (
            <View>
              <Text style={styles.emptyText}>Unable to load notes.</Text>
              <Pressable onPress={() => notes.refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : visible.length ? (
            <View style={styles.list}>
              {visible.map((n: NoteRecordT) => (
                <Pressable
                  key={n.id}
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/notes/[id]', params: { id: n.id } })}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    <IconPencil size={14} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                  </View>
                  <Text style={styles.cardSnippet} numberOfLines={2}>
                    {n.content || 'No content yet'}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {timeAgo(n.updatedAt)} · {wordCount(n.content)} words
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>{search ? `No notes match “${search}”.` : 'No notes yet — tap + to create one.'}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three - 2,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.4,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchWrap: {
    paddingHorizontal: Spacing.four - 6,
    paddingBottom: Spacing.two,
  },
  searchInput: {
    height: 44,
    borderRadius: Radii.lg,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    color: Colors.text,
    paddingHorizontal: 14,
    fontFamily: Fonts.medium,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: Spacing.four - 6,
  },
  scrollContent: {
    gap: 18,
    paddingBottom: Spacing.four,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  list: {
    gap: 8,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  retryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.lime,
    marginTop: 8,
  },
  card: {
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.panelBorderSoft,
    borderRadius: Radii.xl,
    padding: 13,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  cardSnippet: {
    fontFamily: Fonts.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.5)',
  },
  cardMeta: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 8,
  },
});
