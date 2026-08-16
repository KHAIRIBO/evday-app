import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const BRAND = 'khairibo'; // "King Pharma & Colis" appeared nowhere else in
// this project — every other surface (app name, theme, icon) says
// khairibo, so that's what ships in the email. Flagged to the user rather
// than silently guessing which name is the mistake.

function buildContent(code: string) {
  const subject = `Your verification code — ${BRAND}`;
  const text = [
    'Hello,',
    '',
    'Your verification code is:',
    '',
    code,
    '',
    'This code expires in 10 minutes.',
    '',
    'If you did not request this code, you can safely ignore this email.',
    '',
    BRAND,
  ].join('\n');
  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;color:#121212">
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:4px;color:#121212;margin:16px 0">${code}</p>
      <p style="color:#60646C;font-size:13px">This code expires in 10 minutes.</p>
      <p style="color:#60646C;font-size:13px">If you did not request this code, you can safely ignore this email.</p>
      <p style="margin-top:24px">${BRAND}</p>
    </div>`;
  return { subject, text, html };
}

/**
 * Sends the 6-digit verification code. Three paths, tried in order:
 *   1. SMTP (KP_SMTP_*) — the real one now that credentials exist.
 *   2. Resend (RESEND_API_KEY) — kept as an alternative, unused unless
 *      SMTP isn't configured.
 *   3. Console log — dev-only fallback (gated on NODE_ENV, never fires in
 *      production) so the auth flow stays testable with neither
 *      configured. Dead code in this project now that SMTP is set.
 */
export async function sendVerificationCode(email: string, code: string, _purpose: 'register' | 'login') {
  const { subject, text, html } = buildContent(code);

  if (process.env.KP_SMTP_HOST) {
    await sendViaSmtp({ to: email, subject, text, html });
    return;
  }

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? `${BRAND} <onboarding@resend.dev>`,
      to: email,
      subject,
      text,
      html,
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[email] No SMTP/Resend configured — verification code for ${email}: ${code}`);
    return;
  }

  // Neither transport configured, in production: fail loudly rather than
  // silently drop the email or log the code.
  throw new Error('No email transport configured (KP_SMTP_HOST or RESEND_API_KEY required in production)');
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
