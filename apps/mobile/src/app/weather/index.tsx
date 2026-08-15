import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconArrowLeft, IconDroplet, IconEye, IconSun, IconWind } from '@/components/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Panel } from '@/components/ui/panel';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useWeather } from '@/features/use-weather';
import { WeatherIcon } from '@/features/weather-icon';

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Panel style={styles.statTile}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Panel>
  );
}

export default function WeatherDetailsScreen() {
  const router = useRouter();
  const weather = useWeather();
  const w = weather.data;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <IconButton onPress={() => router.back()}>
          <IconArrowLeft size={19} />
        </IconButton>
        <Text style={styles.headerTitle}>Weather</Text>
        <View style={{ width: 38 }} />
      </View>

      {weather.isLoading || !w ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.lime} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={weather.isLoading} onRefresh={() => weather.refresh()} tintColor={Colors.lime} />}>
          <View style={styles.heroRow}>
            <WeatherIcon condition={w.condition} size={56} color={Colors.lime} strokeWidth={1.5} />
            <View>
              <Text style={styles.heroTemp}>{w.tempC}°</Text>
              <Text style={styles.heroCondition}>{w.conditionDescription}</Text>
            </View>
          </View>
          <Text style={styles.city}>{w.city}</Text>
          <Text style={styles.highLow}>
            H {w.highC}° · L {w.lowC}°
          </Text>

          <View style={styles.grid}>
            <StatTile icon={<IconDroplet size={18} color={Colors.lime} />} label="Humidity" value={`${w.humidity}%`} />
            <StatTile icon={<IconWind size={18} color={Colors.lime} />} label="Wind" value={`${w.windKph} km/h`} />
            <StatTile
              icon={<IconEye size={18} color={Colors.lime} />}
              label="Visibility"
              value={w.visibilityKm != null ? `${w.visibilityKm} km` : '—'}
            />
            <StatTile icon={<IconSun size={18} color={Colors.lime} />} label="Sunrise" value={formatTime(w.sunrise)} />
            <StatTile icon={<IconSun size={18} color={Colors.lime} />} label="Sunset" value={formatTime(w.sunset)} />
          </View>

          {w.forecast.length > 0 && (
            <View>
              <Text style={styles.forecastTitle}>Forecast</Text>
              <Panel style={styles.forecastCard}>
                {w.forecast.map((day, i) => (
                  <View key={day.date} style={[styles.forecastRow, i > 0 && styles.forecastRowBorder]}>
                    <Text style={styles.forecastDate}>
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                    <WeatherIcon condition={day.condition} size={18} color={Colors.text} />
                    <Text style={styles.forecastTemps}>
                      {day.highC}° / {day.lowC}°
                    </Text>
                  </View>
                ))}
              </Panel>
            </View>
          )}

          {weather.isOffline && <Text style={styles.offlineNote}>Showing cached weather — you’re offline.</Text>}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three - 2,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.text,
  },
  content: {
    paddingHorizontal: Spacing.four - 6,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: Spacing.two,
  },
  heroTemp: {
    fontFamily: Fonts.extraBold,
    fontSize: 48,
    color: Colors.text,
    letterSpacing: -1,
  },
  heroCondition: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  city: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.text,
  },
  highLow: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: -8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statTile: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  statValue: {
    fontFamily: Fonts.extraBold,
    fontSize: 15,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 9.5,
    color: Colors.textFaint,
  },
  forecastTitle: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.42)',
    marginBottom: 10,
  },
  forecastCard: {
    padding: 0,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  forecastRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.panelBorder,
  },
  forecastDate: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.text,
    width: 44,
  },
  forecastTemps: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  offlineNote: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textFaint,
    textAlign: 'center',
  },
});
