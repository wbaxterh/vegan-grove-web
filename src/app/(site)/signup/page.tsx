import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';
import { Screen } from '@/components/screen';

export const metadata: Metadata = {
  title: 'Sign up',
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <Screen
      label="Account"
      title="Create an account"
      context="A handle, an email for logging in, and a password. Your home area comes later, from a fixed list, and is never shown to anyone."
      action={<SignupForm />}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">
            What you agree to
          </p>
          <p className="text-muted-foreground">
            The{' '}
            <Link href="/privacy" className="text-vg-accent-2 hover:underline">
              privacy promise
            </Link>{' '}
            and the{' '}
            <Link href="/terms" className="text-vg-accent-2 hover:underline">
              terms
            </Link>
            . Deleting your account later removes everything, immediately.
          </p>
          <p className="text-muted-foreground">
            Already a member?{' '}
            <Link href="/login" className="text-vg-accent-2 hover:underline">
              Log in
            </Link>
            .
          </p>
        </>
      }
      className="max-w-3xl"
    />
  );
}
