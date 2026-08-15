import { Resend } from 'resend';

/**
 * Sends the 6-digit verification code. Falls back to logging the code to
 * the server console when RESEND_API_KEY isn't set, so the auth flow is
 * fully testable end-to-end before a Resend account exists — this is a
 * dev convenience, not something that should ever fire in production
 * (set RESEND_API_KEY and this path is dead code).
 */
export async function sendVerificationCode(email: string, code: string, purpose: 'register' | 'login') {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[email] RESEND_API_KEY not set — verification code for ${email} (${purpose}): ${code}`,
    );
    return;
  }

  const resend = new Resend(apiKey);
  const subject = purpose === 'register' ? 'Verify your email' : 'Your sign-in code';
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'khairibo <onboarding@resend.dev>',
    to: email,
    subject,
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`,
  });
}
