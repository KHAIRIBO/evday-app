import { EmailAuthForm } from '@/components/email-auth-form';

export default function SignUpScreen() {
  return (
    <EmailAuthForm
      title={'Create your\nworkspace'}
      subtitle="Enter your email to get started — we’ll send a 6-digit code, no password needed."
      linkPrompt="Already have an account?"
      linkLabel="Log in"
      linkHref="/(auth)/signin"
    />
  );
}
