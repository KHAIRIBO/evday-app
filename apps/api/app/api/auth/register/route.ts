import { RequestCodeInput } from '@workspace/shared/schema';
import { NextRequest, NextResponse } from 'next/server';

import { requestVerificationCode } from '@/lib/auth-flow';
import { errorResponse, validationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const parsed = RequestCodeInput.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);

    await requestVerificationCode(parsed.data.email, 'register');
    return NextResponse.json({ data: { message: 'Verification code sent' } });
  } catch (error) {
    return errorResponse(error);
  }
}
