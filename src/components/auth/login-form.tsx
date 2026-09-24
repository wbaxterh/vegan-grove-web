'use client';

import { KeyRound, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError, apiFetch } from '@/lib/api';

type Props = { next: string; magicToken?: string };

type Status = 'idle' | 'submitting' | 'sent' | 'verifying';

async function createSession(body: Record<string, string>): Promise<void> {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.ok) return;
  const data = (await response.json().catch(() => null)) as {
    error?: { code: string; message: string };
  } | null;
  throw new ApiError(
    response.status,
    data?.error?.code ?? `http_${response.status}`,
    data?.error?.message ?? 'Could not log in.',
  );
}

function describe(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Could not reach the API. Try again in a moment.';
}

export function LoginForm({ next, magicToken }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>(magicToken ? 'verifying' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const verified = useRef(false);

  // Landing here from a magic-link email: exchange the token for a session once.
  useEffect(() => {
    if (!magicToken || verified.current) return;
    verified.current = true;
    createSession({ mode: 'magic-link-verify', token: magicToken })
      .then(() => {
        router.replace(next);
        router.refresh();
      })
      .catch((cause: unknown) => {
        setError(describe(cause));
        setStatus('idle');
      });
  }, [magicToken, next, router]);

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('submitting');
    try {
      await createSession({ mode: 'password', email, password });
      router.push(next);
      router.refresh();
    } catch (cause) {
      setError(describe(cause));
      setStatus('idle');
    }
  }

  async function requestMagicLink() {
    if (!email) {
      setError('Enter your email first.');
      return;
    }
    setError(null);
    setStatus('submitting');
    try {
      // The API answers 202 whether or not the address exists (no account enumeration).
      await apiFetch<void>('/auth/magic-link', { method: 'POST', json: { email } });
      setStatus('sent');
    } catch (cause) {
      setError(describe(cause));
      setStatus('idle');
    }
  }

  if (status === 'verifying') {
    return <p className="font-mono text-sm text-muted-foreground">Checking your link</p>;
  }

  if (status === 'sent') {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-muted-foreground">
          If that address has an account, a sign-in link is on its way. It works for 15 minutes.
        </p>
      </div>
    );
  }

  const busy = status === 'submitting';

  return (
    <form onSubmit={submitPassword} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="font-mono text-xs uppercase tracking-[0.2em]">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="font-mono text-xs uppercase tracking-[0.2em]">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          <KeyRound data-icon="inline-start" aria-hidden="true" />
          Log in
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={requestMagicLink}>
          <Mail data-icon="inline-start" aria-hidden="true" />
          Email me a link instead
        </Button>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Coming soon
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" disabled>
            Continue with Apple
          </Button>
          <Button type="button" variant="outline" disabled>
            Continue with Google
          </Button>
        </div>
      </div>
    </form>
  );
}
