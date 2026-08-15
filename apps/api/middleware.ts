import { NextResponse, type NextRequest } from 'next/server';

// TODO: verify the bearer JWT here (or in requireUser per-route) and
// restrict CORS to the app scheme + the local dev origin. Scaffold only.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
