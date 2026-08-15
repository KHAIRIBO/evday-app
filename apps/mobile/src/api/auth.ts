import type { AuthTokensT } from '@workspace/shared/schema';

import { request } from './client';

export const authApi = {
  // Always hits /register: the server's verify-email logic is idempotent
  // on an existing email (logs the account in) regardless of which
  // endpoint requested the code, so one unified "enter your email"
  // screen covers both new and returning users — matches the design,
  // which never had a separate login-vs-register choice.
  requestCode: (email: string) =>
    request<{ message: string }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyCode: (email: string, code: string) =>
    request<AuthTokensT>('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ email, code }) }),

  logout: (refreshToken: string) =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};
