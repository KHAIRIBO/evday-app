import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray package-lock.json elsewhere on this
  // machine otherwise makes Next.js guess wrong.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  // TODO: allow the mobile dev origin once CORS rules land in middleware.ts
};

export default nextConfig;
