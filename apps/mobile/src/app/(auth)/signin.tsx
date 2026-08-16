import { EmailAuthForm } from '@/components/email-auth-form';

// The first screen a new device shows once there's no stored session (see
// index.tsx / login.tsx redirect chain) and the destination of "Forgot
// passcode?". Same real backend as signup.tsx — see email-auth-form.tsx.
export default function SignInScreen() {
  return (
    <EmailAuthForm
      title={'Log in to\nyour workspace'}
      subtitle="Enter your email — we’ll send a 6-digit code, no password needed."
      linkPrompt="Don’t have an account?"
      linkLabel="Sign up"
      linkHref="/(auth)/signup"
    />
  );
}
