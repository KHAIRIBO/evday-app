import { RequestCodeInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requestVerificationCode } from '@/lib/auth-flow';
import { errorResponse, validationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const parsed = RequestCodeInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    // Same generic response whether or not the account exists — the
    // endpoint shouldn't leak which emails are registered.
    await requestVerificationCode(parsed.data.email, 'login');
    return NextResponse.json({ data: { message: 'If that account exists, a code was sent' } });
  } catch (error) {
    return errorResponse(error);
  }
}
