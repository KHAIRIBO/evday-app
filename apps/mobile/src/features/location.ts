import * as Location from 'expo-location';

import { secureStorage } from '@/lib/secure-storage';

const MANUAL_LOCATION_KEY = 'khairibo.manualLocationCity';

export type WeatherLocation = { type: 'coords'; lat: number; lon: number } | { type: 'city'; city: string };

/**
 * Device GPS when permission is available; the user's saved manual city
 * otherwise. Returns null only when neither is available — the caller
 * (WeatherCard) shows a "set your location" prompt in that case, never a
 * hardcoded default city.
 */
export async function getWeatherLocation(): Promise<WeatherLocation | null> {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Location.requestForegroundPermissionsAsync());
    }
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      return { type: 'coords', lat: pos.coords.latitude, lon: pos.coords.longitude };
    }
  } catch {
    // GPS unavailable/timed out (simulator, indoors, etc.) — fall through to manual.
  }

  const city = await secureStorage.getItem(MANUAL_LOCATION_KEY);
  return city ? { type: 'city', city } : null;
}

export async function getSavedManualCity(): Promise<string | null> {
  return secureStorage.getItem(MANUAL_LOCATION_KEY);
}

export async function setManualCity(city: string): Promise<void> {
  await secureStorage.setItem(MANUAL_LOCATION_KEY, city.trim());
}
