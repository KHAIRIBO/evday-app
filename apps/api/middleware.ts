import { NextResponse, type NextRequest } from 'next/server';

// Auth itself is verified per-route (requireUser in lib/auth.ts) rather
// than here — middleware runs on every /api/* request including ones with
// no user yet (register, login), so it can't gate on a valid JWT. This
// layer only does CORS. The per-user rate-limit budgets (assistant,
// upload) live in the routes that need them, via lib/rate-limit.ts, where
// profileId is already resolved; the "general" 1000 req/h budget it also
// defines isn't wired into every route yet — hitting it per-request from
// edge middleware would add a Redis round-trip to every single call, so
// it needs a deliberate call before that trade-off is worth making.

const DEV_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/, // LAN IP — physical device dev testing
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // native fetch (Expo Go / built app) sends no Origin header
  const configured = process.env.CORS_ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
  if (configured.includes(origin)) return true;
  return DEV_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowed = isAllowedOrigin(origin);

  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: allowed ? 204 : 403 });
    if (allowed && origin) applyCors(res, origin);
    return res;
  }

  const res = NextResponse.next();
  if (allowed && origin) applyCors(res, origin);
  return res;
}

function applyCors(res: NextResponse, origin: string) {
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.headers.set('Vary', 'Origin');
}

export const config = {
  matcher: '/api/:path*',
};
