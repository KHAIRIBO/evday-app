import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { analyticsApi } from '@/api/analytics';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { profileApi } from '@/api/profile';
import { IconArrowLeft, IconCheck, IconLock, IconLogOut, IconPencil, IconX } from '@/components/icon';
import { GhostButton, LimeButton } from '@/components/ui/buttons';
import { IconButton } from '@/components/ui/icon-button';
import { ListItem } from '@/components/ui/list-item';
import { Panel } from '@/components/ui/panel';
import { useSession } from '@/stores/session';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

function initials(displayName: string | null, email: string) {
  const source = displayName?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const chars = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return chars.toUpperCase();
}

function formatBytes(bytes: number) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const sessionUser = useSession((s) => s.user);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  const profile = useQuery({ queryKey: ['profile'], queryFn: profileApi.get });
  const analytics = useQuery({ queryKey: ['analytics', 'week'], queryFn: () => analyticsApi.summary('week') });

  const updateName = useMutation({
    mutationFn: (displayName: string | null) => profileApi.updateDisplayName(displayName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
    },
  });

  function startEdit() {
    setNameDraft(profile.data?.displayName ?? '');
    setEditing(true);
  }

  function saveEdit() {
    const trimmed = nameDraft.trim();
    updateName.mutate(trimmed.length > 0 ? trimmed : null);
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'You will need to verify your email again to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            const refreshToken = await useSession.getState().getRefreshToken();
            // Best-effort server-side revoke — local sign-out proceeds
            // either way; a network failure here shouldn't trap the user.
            if (refreshToken) await authApi.logout(refreshToken).catch(() => {});
          } finally {
            await useSession.getState().clearSession();
            await useSession.getState().clearPasscode();
            router.replace('/(auth)/signin');
          }
        },
      },
    ]);
  }

  const email = profile.data?.email ?? sessionUser?.email ?? '';
  const loading = profile.isLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <IconArrowLeft size={19} />
        </IconButton>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={Colors.lime} />
        </View>
      ) : profile.isError ? (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>
            {profile.error instanceof ApiError ? profile.error.message : 'Could not load your profile'}
          </Text>
          <Pressable onPress={() => profile.refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarBlock}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(profile.data!.displayName, email)}</Text>
            </View>

            {editing ? (
              <View style={styles.editRow}>
                <TextInput
                  style={styles.nameInput}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoFocus
                  maxLength={80}
                  onSubmitEditing={saveEdit}
                  returnKeyType="done"
                />
                <IconButton onPress={saveEdit} disabled={updateName.isPending} accent>
                  <IconCheck size={16} color={Colors.limeText} />
                </IconButton>
                <IconButton onPress={() => setEditing(false)} disabled={updateName.isPending}>
                  <IconX size={16} />
                </IconButton>
              </View>
            ) : (
              <Pressable style={styles.nameRow} onPress={startEdit}>
                <Text style={styles.name}>{profile.data!.displayName || 'Add your name'}</Text>
                <IconPencil size={14} color="rgba(255,255,255,0.4)" />
              </Pressable>
            )}
            {updateName.isError ? <Text style={styles.errorText}>Could not save — try again</Text> : null}

            <Text style={styles.email}>{email}</Text>
            <Text style={styles.memberSince}>
              Member since{' '}
              {new Date(profile.data!.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </Text>
          </View>

          <Panel variant="lime">
            {analytics.data ? (
              <>
                <View style={styles.storageTop}>
                  <Text style={styles.storageVal}>{formatBytes(analytics.data.storageUsed)}</Text>
                  <Text style={styles.storageLbl}>of {formatBytes(profile.data!.storageQuota)}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.round((analytics.data.storageUsed / (profile.data!.storageQuota || 1)) * 100))}%` },
                    ]}
                  />
                </View>
              </>
            ) : (
              <ActivityIndicator color={Colors.limeText} />
            )}
          </Panel>

          <View style={styles.list}>
            <ListItem
              icon={<IconLock size={17} color={Colors.lime} />}
              name="Change passcode"
              meta="Update your local unlock passcode"
              onPress={() => router.push({ pathname: '/(auth)/passcode-setup', params: { redirectTo: '/profile' } })}
            />
          </View>

          <GhostButton label={signingOut ? 'Signing out…' : 'Sign out'} onPress={handleSignOut} disabled={signingOut} style={styles.signOut}>
            <IconLogOut size={16} color="rgba(255,255,255,0.75)" />
          </GhostButton>
        </ScrollView>
      )}
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
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.text,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12.5,
    color: Colors.lime,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four - 6,
    paddingBottom: Spacing.four,
    gap: 14,
  },
  avatarBlock: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
    color: Colors.limeText,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    fontFamily: Fonts.extraBold,
    fontSize: 19,
    letterSpacing: -0.3,
    color: Colors.text,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  nameInput: {
    flex: 1,
    height: 40,
    borderRadius: Radii.lg,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    color: Colors.text,
    paddingHorizontal: 12,
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  email: {
    fontFamily: Fonts.medium,
    fontSize: 12.5,
    color: Colors.textMuted,
    marginTop: 6,
  },
  memberSince: {
    fontFamily: Fonts.medium,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
  storageTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  storageVal: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    color: Colors.limeText,
    letterSpacing: -0.4,
  },
  storageLbl: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: 'rgba(19,19,19,0.62)',
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(19,19,19,0.16)',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.limeText,
  },
  list: {
    gap: 8,
  },
  signOut: {
    marginTop: 6,
  },
});
