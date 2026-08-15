import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { weatherApi } from '@/api/weather';
import { secureStorage } from '@/lib/secure-storage';
import type { WeatherDetailT } from '@workspace/shared/schema';

import { getWeatherLocation, type WeatherLocation } from './location';

const CACHE_KEY = 'khairibo.weatherCache';
// Matches the server's own cache TTL (apps/api/app/api/weather/route.ts) —
// no point re-fetching more often than the server would return fresh data.
const STALE_MS = 10 * 60 * 1000;

interface CachedWeather {
  data: WeatherDetailT;
  cachedAt: string;
}

async function readCache(): Promise<CachedWeather | null> {
  const raw = await secureStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedWeather;
  } catch {
    return null;
  }
}

async function writeCache(data: WeatherDetailT) {
  await secureStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: new Date().toISOString() }));
}

/**
 * Real offline support: on fetch failure, falls back to the last
 * successful response persisted across app restarts (not just React
 * Query's in-memory cache) — "no fake current weather", per spec.
 */
export function useWeather() {
  const qc = useQueryClient();
  const [location, setLocation] = useState<WeatherLocation | null | undefined>(undefined); // undefined = still resolving
  const [cached, setCached] = useState<CachedWeather | null | undefined>(undefined);

  useEffect(() => {
    getWeatherLocation().then(setLocation);
    readCache().then(setCached);
  }, []);

  const query = useQuery({
    queryKey: ['weather', location],
    queryFn: () => weatherApi.get(location!),
    enabled: Boolean(location),
    staleTime: STALE_MS,
    retry: 1,
  });

  useEffect(() => {
    if (query.data) writeCache(query.data).then(() => setCached({ data: query.data, cachedAt: new Date().toISOString() }));
  }, [query.data]);

  async function refreshLocation() {
    const loc = await getWeatherLocation();
    setLocation(loc);
  }

  async function refresh() {
    if (location) await qc.invalidateQueries({ queryKey: ['weather', location] });
    else await refreshLocation();
  }

  const resolvingLocation = location === undefined || cached === undefined;
  const data = query.data ?? (query.isError ? cached?.data : undefined);
  const isOffline = Boolean(query.isError && cached?.data);

  return {
    data,
    isLoading: resolvingLocation || (query.isFetching && !data),
    isError: query.isError && !cached?.data,
    isOffline,
    updatedAt: query.data ? new Date().toISOString() : cached?.cachedAt,
    needsLocation: !resolvingLocation && location === null,
    refresh,
    refreshLocation,
  };
}
