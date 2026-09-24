import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Screen } from '@/components/screen';
import { safeNextPath } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const token = typeof params.token === 'string' ? params.token : undefined;

  return (
    <Screen
      label="Account"
      title="Log in"
      context="Your email is for logging in only. Nobody else ever sees it."
      action={<LoginForm next={next} magicToken={token} />}
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">New here</p>
          <p className="text-muted-foreground">
            <Link href="/signup" className="text-vg-accent-2 hover:underline">
              Create an account
            </Link>{' '}
            with an email, a handle, and a home area. That is the whole form.
          </p>
        </>
      }
      className="max-w-3xl"
    />
  );
}
