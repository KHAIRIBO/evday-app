import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconDroplet, IconMapPin, IconWind } from '@/components/icon';
import { Colors, Fonts, Radii } from '@/constants/theme';
import { setManualCity } from '@/features/location';
import { useWeather } from '@/features/use-weather';
import { WeatherIcon } from '@/features/weather-icon';

import { Panel } from './ui/panel';

function minutesAgo(iso?: string) {
  if (!iso) return null;
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'just now';
  return `${mins} min ago`;
}

export function WeatherCard() {
  const router = useRouter();
  const weather = useWeather();
  const [settingLocation, setSettingLocation] = useState(false);
  const [cityInput, setCityInput] = useState('');

  if (weather.isLoading) return <WeatherCardSkeleton />;

  if (weather.needsLocation) {
    return (
      <Panel style={styles.card}>
        {settingLocation ? (
          <TextInput
            style={styles.locationInput}
            value={cityInput}
            onChangeText={setCityInput}
            placeholder="Enter your city (e.g. Tunis)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={async () => {
              if (!cityInput.trim()) return;
              await setManualCity(cityInput.trim());
              await weather.refreshLocation();
              setSettingLocation(false);
            }}
          />
        ) : (
          <Pressable style={styles.promptRow} onPress={() => setSettingLocation(true)}>
            <IconMapPin size={18} color={Colors.textFaint} />
            <Text style={styles.promptText}>Set your location to see the weather</Text>
          </Pressable>
        )}
      </Panel>
    );
  }

  if (weather.isError || !weather.data) {
    return (
      <Pressable onPress={() => weather.refresh()}>
        <Panel style={styles.card}>
          <Text style={styles.errorText}>Couldn’t load weather — tap to retry</Text>
        </Panel>
      </Pressable>
    );
  }

  const w = weather.data;
  const ago = weather.isOffline ? minutesAgo(weather.updatedAt) : null;

  return (
    <Pressable onPress={() => router.push('/weather')}>
      <Panel style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <WeatherIcon condition={w.condition} size={30} color={Colors.lime} strokeWidth={1.7} />
            <View style={styles.leftText}>
              <View style={styles.tempRow}>
                <Text style={styles.temp}>{w.tempC}°</Text>
                <Text style={styles.condition}>{w.condition}</Text>
              </View>
              <Text style={styles.meta}>
                {w.city} · H {w.highC}° L {w.lowC}°
              </Text>
            </View>
          </View>
          <View style={styles.right}>
            <View style={styles.statRow}>
              <IconDroplet size={12} color={Colors.textFaint} />
              <Text style={styles.statText}>{w.humidity}%</Text>
            </View>
            <View style={styles.statRow}>
              <IconWind size={12} color={Colors.textFaint} />
              <Text style={styles.statText}>{w.windKph} km/h</Text>
            </View>
          </View>
        </View>
        {ago && <Text style={styles.offlineText}>Updated {ago}</Text>}
      </Panel>
    </Pressable>
  );
}

export function WeatherCardSkeleton() {
  return (
    <Panel style={styles.card}>
      <View style={styles.row}>
        <View style={styles.left}>
          <View style={[styles.skeletonBlock, { width: 30, height: 30, borderRadius: 15 }]} />
          <View style={styles.leftText}>
            <View style={[styles.skeletonBlock, { width: 70, height: 16, marginBottom: 6 }]} />
            <View style={[styles.skeletonBlock, { width: 120, height: 11 }]} />
          </View>
        </View>
        <View style={styles.right}>
          <View style={[styles.skeletonBlock, { width: 40, height: 11, marginBottom: 6 }]} />
          <View style={[styles.skeletonBlock, { width: 50, height: 11 }]} />
        </View>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  leftText: {
    flexShrink: 1,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  temp: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  condition: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  meta: {
    fontFamily: Fonts.medium,
    fontSize: 10.5,
    color: Colors.textFaint,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontFamily: Fonts.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  offlineText: {
    fontFamily: Fonts.medium,
    fontSize: 9.5,
    color: Colors.textGhost,
    marginTop: 8,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  promptText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  locationInput: {
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Colors.fieldBorder,
    color: Colors.text,
    paddingHorizontal: 12,
    fontFamily: Fonts.medium,
    fontSize: 12.5,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  skeletonBlock: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
  },
});
