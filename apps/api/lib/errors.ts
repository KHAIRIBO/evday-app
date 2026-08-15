import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: { code: 'INTERNAL' } }, { status: 500 });
}

export function validationError(error: ZodError) {
  return NextResponse.json({ error: { code: 'VALIDATION', issues: error.issues } }, { status: 422 });
}
