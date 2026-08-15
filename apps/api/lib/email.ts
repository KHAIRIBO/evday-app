import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Sends the 6-digit verification code. Three paths, tried in order:
 *   1. SMTP (KP_SMTP_*) — the real one now that credentials exist.
 *   2. Resend (RESEND_API_KEY) — kept as an alternative, unused unless
 *      SMTP isn't configured.
 *   3. Console log — dev fallback so the auth flow stays testable with
 *      neither configured. Should never fire once KP_SMTP_HOST is set.
 */
export async function sendVerificationCode(email: string, code: string, purpose: 'register' | 'login') {
  const subject = purpose === 'register' ? 'Verify your email' : 'Your sign-in code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p>`;

  if (process.env.KP_SMTP_HOST) {
    await sendViaSmtp({ to: email, subject, text, html });
    return;
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'khairibo <onboarding@resend.dev>',
      to: email,
      subject,
      text,
      html,
    });
    return;
  }

  console.warn(`[email] No SMTP/Resend configured — verification code for ${email} (${purpose}): ${code}`);
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.KP_SMTP_HOST;
  const port = Number(process.env.KP_SMTP_PORT ?? 587);
  const user = process.env.KP_SMTP_USER;
  const pass = process.env.KP_SMTP_PASS;
  if (!host || !user || !pass) throw new Error('KP_SMTP_HOST/KP_SMTP_USER/KP_SMTP_PASS not fully set');

  // KP_SMTP_SECURE: 'ssl' = implicit TLS (typically port 465), 'tls' =
  // STARTTLS (typically port 587, e.g. Gmail) — these are different
  // handshakes, not interchangeable, hence the explicit mapping rather
  // than just `secure: Boolean(KP_SMTP_SECURE)`.
  const mode = (process.env.KP_SMTP_SECURE ?? 'tls').toLowerCase();
  const secure = mode === 'ssl';
  const requireTLS = mode === 'tls';

  transporter = nodemailer.createTransport({ host, port, secure, requireTLS, auth: { user, pass } });
  return transporter;
}

async function sendViaSmtp(input: { to: string; subject: string; text: string; html: string }) {
  const from = process.env.KP_EMAIL_FROM ?? process.env.KP_SMTP_USER!;
  await getTransporter().sendMail({ from, ...input });
}
