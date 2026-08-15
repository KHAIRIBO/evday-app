import type { WeatherDetailT } from '@workspace/shared/schema';

import { request } from './client';
import type { WeatherLocation } from '@/features/location';

export const weatherApi = {
  get: (location: WeatherLocation) => {
    const params = new URLSearchParams();
    if (location.type === 'coords') {
      params.set('lat', String(location.lat));
      params.set('lon', String(location.lon));
    } else {
      params.set('city', location.city);
    }
    return request<WeatherDetailT>(`/api/weather?${params}`);
  },
};
