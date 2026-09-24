'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { DEFAULT_AFTER_LOGIN } from '@/lib/navigation';

const HANDLE_PATTERN = /^[a-z0-9_]{3,24}$/;

export function SignupForm() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!HANDLE_PATTERN.test(handle)) {
      setError('Handles are 3 to 24 characters: lowercase letters, digits, and underscores.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'register', email, password, handle }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: { code: string; message: string };
        } | null;
        throw new ApiError(
          response.status,
          data?.error?.code ?? `http_${response.status}`,
          data?.error?.message ?? 'Could not create the account.',
        );
      }
      router.push(DEFAULT_AFTER_LOGIN);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'Could not reach the API. Try again shortly.',
      );
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="handle" className="font-mono text-xs uppercase tracking-[0.2em]">
          Handle
        </label>
        <Input
          id="handle"
          name="handle"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={handle}
          onChange={(event) => setHandle(event.target.value.toLowerCase())}
        />
        <p className="text-xs text-muted-foreground">
          The only name anyone sees. No real name field exists.
        </p>
      </div>
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
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy}>
        Create account
      </Button>
    </form>
  );
}
