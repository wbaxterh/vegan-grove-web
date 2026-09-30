'use client';

import { Bookmark, BookmarkCheck, Heart, type LucideIcon, Megaphone, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { SITE } from '@/lib/site';
import type { MediaItem, MediaReaction, MediaViewer } from '@/lib/types';
import { cn } from '@/lib/utils';

type MediaActionsProps = {
  mediaId: string;
  slug: string;
  title: string;
  signedIn: boolean;
  viewer: MediaViewer | null;
  stats: MediaItem['stats'];
};

type ReactionResponse = { stats: MediaItem['stats']; viewer: MediaViewer };

async function call<T>(path: string, method: 'POST' | 'DELETE', json?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: json
      ? { 'Content-Type': 'application/json', Accept: 'application/json' }
      : { Accept: 'application/json' },
    body: json ? JSON.stringify(json) : undefined,
  });
  if (!response.ok) throw new Error(`http_${response.status}`);
  return (await response.json()) as T;
}

type ActionSpec = {
  key: 'save' | MediaReaction;
  label: string;
  icon: LucideIcon;
  active: boolean;
  count: number;
  hint: string;
};

/**
 * Save, "This moved me", "I took action", Share. Signed in, the first three call this site's
 * own `/api/media/:id/...` routes, which forward the session as a bearer token. Signed out,
 * they are links to log in and come straight back here. Counts are aggregates; nobody is named.
 */
export function MediaActions({ mediaId, slug, title, signedIn, viewer, stats }: MediaActionsProps) {
  const [saved, setSaved] = useState(viewer?.saved ?? false);
  const [reactions, setReactions] = useState<ReadonlySet<MediaReaction>>(
    () => new Set(viewer?.reactions ?? []),
  );
  const [counts, setCounts] = useState(stats);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pageUrl = `${SITE.url}/media/${slug}`;
  const loginHref = `/login?next=${encodeURIComponent(`/media/${slug}`)}`;

  const run = async (key: string, work: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      await work();
    } catch {
      setError('That did not go through. Try again in a moment.');
    } finally {
      setBusy(null);
    }
  };

  const toggleSave = () =>
    run('save', async () => {
      const next = !saved;
      const data = await call<{ saved: boolean }>(
        `/api/media/${mediaId}/save`,
        next ? 'POST' : 'DELETE',
      );
      setSaved(data.saved);
      setCounts((current) => ({
        ...current,
        saves: Math.max(0, current.saves + (data.saved === saved ? 0 : data.saved ? 1 : -1)),
      }));
    });

  const toggleReaction = (type: MediaReaction) =>
    run(type, async () => {
      const has = reactions.has(type);
      const data = has
        ? await call<ReactionResponse>(`/api/media/${mediaId}/reactions/${type}`, 'DELETE')
        : await call<ReactionResponse>(`/api/media/${mediaId}/reactions`, 'POST', { type });
      setCounts(data.stats ?? counts);
      setReactions(new Set(data.viewer?.reactions ?? []));
    });

  const share = async () => {
    setError(null);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title, url: pageUrl });
        return;
      }
      await navigator.clipboard.writeText(pageUrl);
      setNotice('Link copied');
      window.setTimeout(() => setNotice(null), 2_500);
    } catch {
      // The member dismissed the share sheet or the clipboard is blocked; nothing to report.
    }
  };

  const actions: ActionSpec[] = [
    {
      key: 'save',
      label: saved ? 'Saved' : 'Save',
      icon: saved ? BookmarkCheck : Bookmark,
      active: saved,
      count: counts.saves,
      hint: 'Keep this title on your private watchlist',
    },
    {
      key: 'moved',
      label: 'This moved me',
      icon: Heart,
      active: reactions.has('moved'),
      count: counts.moved,
      hint: 'Say this one landed',
    },
    {
      key: 'acted',
      label: 'I took action',
      icon: Megaphone,
      active: reactions.has('acted'),
      count: counts.acted,
      hint: 'Say this one got you out the door',
    },
  ];

  return (
    <div data-testid="media-actions" className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const content = (
          <>
            <action.icon
              data-icon="inline-start"
              aria-hidden="true"
              className={cn(action.active && action.key !== 'save' && 'fill-current')}
            />
            {action.label}
            <span className="font-mono text-xs opacity-70">{action.count}</span>
          </>
        );
        if (!signedIn) {
          return (
            <Link
              key={action.key}
              href={loginHref}
              title={`Log in to ${action.key === 'save' ? 'save' : 'react'}`}
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              {content}
            </Link>
          );
        }
        return (
          <Button
            key={action.key}
            type="button"
            variant={action.active ? 'default' : 'outline'}
            aria-pressed={action.active}
            title={action.hint}
            disabled={busy !== null}
            onClick={() => (action.key === 'save' ? toggleSave() : toggleReaction(action.key))}
          >
            {content}
          </Button>
        );
      })}
      <Button type="button" variant="ghost" onClick={share}>
        <Share2 data-icon="inline-start" aria-hidden="true" />
        Share
      </Button>
      <span role="status" aria-live="polite" className="font-mono text-xs text-muted-foreground">
        {notice}
      </span>
      {error ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
