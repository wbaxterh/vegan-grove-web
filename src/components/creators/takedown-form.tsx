'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { submitTakedown, type TakedownState } from '@/lib/takedown';

const initial: TakedownState | null = null;

export function TakedownForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(submitTakedown, initial);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <div className="space-y-1.5">
        <label htmlFor="takedown-request" className="text-sm font-medium">
          Request
        </label>
        <textarea
          id="takedown-request"
          name="request"
          required
          minLength={2}
          maxLength={1000}
          rows={5}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          placeholder="What should change, or that this page should be removed"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="takedown-link" className="text-sm font-medium">
          Link to your site or channel
        </label>
        <input
          id="takedown-link"
          name="link"
          type="url"
          required
          inputMode="url"
          autoComplete="url"
          placeholder="https://"
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Submitting' : 'Submit the request'}
      </Button>
      {state ? (
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
