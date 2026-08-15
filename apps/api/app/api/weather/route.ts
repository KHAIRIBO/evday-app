import { WeatherDetail, type WeatherConditionT, type WeatherDetailT } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/auth';
import { ApiError, errorResponse } from '@/lib/errors';
import { getRedis } from '@/lib/redis';

// "Reasonable weather cache to avoid unnecessary API requests" — OpenWeather's
// free tier is 1000 calls/day; a 10-min cache keyed by a coarse lat/lon grid
// (or city name) keeps this well under that even with many users nearby.
const CACHE_TTL_SECONDS = 10 * 60;

function mapCondition(main: string): WeatherConditionT {
  switch (main) {
    case 'Clear':
    case 'Clouds':
    case 'Rain':
    case 'Drizzle':
    case 'Thunderstorm':
    case 'Snow':
    case 'Fog':
    case 'Mist':
    case 'Haze':
      return main;
    // OpenWeather has a few more atmosphere codes than we have icons for —
    // fold them into the closest visual match rather than adding icons
    // nobody asked for.
    case 'Smoke':
    case 'Dust':
    case 'Sand':
    case 'Ash':
      return 'Haze';
    default:
      return 'Clouds';
  }
}

function roundCoord(v: string) {
  // ~5km grid — keeps the cache useful without being meaningfully imprecise
  // for "what's the weather like here".
  return Math.round(parseFloat(v) * 20) / 20;
}

async function fetchOpenWeather(path: 'weather' | 'forecast', params: URLSearchParams, apiKey: string) {
  params.set('appid', apiKey);
  params.set('units', 'metric');
  const res = await fetch(`https://api.openweathermap.org/data/2.5/${path}?${params}`);
  if (!res.ok) {
    if (res.status === 404) throw new ApiError(404, 'LOCATION_NOT_FOUND', 'Could not find that location');
    throw new ApiError(502, 'WEATHER_PROVIDER_ERROR', `OpenWeather returned ${res.status}`);
  }
  return res.json();
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

interface ForecastEntry {
  dt_txt: string;
  main: { temp: number };
  weather: { main: string }[];
}

function buildResult(
  current: {
    name: string;
    main: { temp: number; temp_min: number; temp_max: number; humidity: number };
    weather: { main: string; description: string }[];
    wind: { speed: number };
    visibility?: number;
    sys: { sunrise: number; sunset: number };
  },
  forecast: { list: ForecastEntry[] },
): WeatherDetailT {
  const byDate = new Map<string, { temps: number[]; conditions: string[] }>();
  for (const entry of forecast.list) {
    const date = entry.dt_txt.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, { temps: [], conditions: [] });
    const bucket = byDate.get(date)!;
    bucket.temps.push(entry.main.temp);
    bucket.conditions.push(entry.weather[0].main);
  }

  const days = [...byDate.entries()].slice(0, 5).map(([date, { temps, conditions }]) => ({
    date,
    highC: Math.round(Math.max(...temps)),
    lowC: Math.round(Math.min(...temps)),
    condition: mapCondition(mostCommon(conditions)),
  }));
  const today = days[0];

  return {
    city: current.name,
    tempC: Math.round(current.main.temp),
    condition: mapCondition(current.weather[0].main),
    conditionDescription: current.weather[0].description,
    highC: today?.highC ?? Math.round(current.main.temp_max),
    lowC: today?.lowC ?? Math.round(current.main.temp_min),
    humidity: current.main.humidity,
    windKph: Math.round(current.wind.speed * 3.6),
    visibilityKm: typeof current.visibility === 'number' ? Math.round(current.visibility / 100) / 10 : null,
    sunrise: new Date(current.sys.sunrise * 1000).toISOString(),
    sunset: new Date(current.sys.sunset * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    forecast: days,
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireUser(req);

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new ApiError(500, 'CONFIG_ERROR', 'OPENWEATHER_API_KEY is not set');

    const lat = req.nextUrl.searchParams.get('lat');
    const lon = req.nextUrl.searchParams.get('lon');
    const city = req.nextUrl.searchParams.get('city');
    if (!(lat && lon) && !city) throw new ApiError(422, 'VALIDATION', 'Provide lat & lon, or city');

    const cacheKey =
      lat && lon ? `weather:${roundCoord(lat)},${roundCoord(lon)}` : `weather:city:${city!.trim().toLowerCase()}`;

    const redis = getRedis();
    if (redis) {
      const cached = await redis.get<WeatherDetailT>(cacheKey);
      if (cached) return NextResponse.json({ data: cached });
    }

    const locationParams = () => {
      const p = new URLSearchParams();
      if (lat && lon) {
        p.set('lat', lat);
        p.set('lon', lon);
      } else {
        p.set('q', city!);
      }
      return p;
    };

    const [current, forecast] = await Promise.all([
      fetchOpenWeather('weather', locationParams(), apiKey),
      fetchOpenWeather('forecast', locationParams(), apiKey),
    ]);

    const result = WeatherDetail.parse(buildResult(current, forecast));
    if (redis) await redis.set(cacheKey, result, { ex: CACHE_TTL_SECONDS });

    return NextResponse.json({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
