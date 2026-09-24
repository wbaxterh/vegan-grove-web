import type { Metadata } from 'next';
import { Screen } from '@/components/screen';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Vegan Grove collects, what it never collects, and why.',
};

const RULES = [
  {
    title: 'Profiles are never public.',
    body: 'There is no profile page and no way to look a member up. If you opt in to public posts, the only public view shows your handle, your avatar, and those posts: no bio, no area, no friends, no counts.',
  },
  {
    title: 'We collect the minimum.',
    body: 'An account is an email (for logging in, never shown to anyone), a handle, an optional avatar, and a home area picked from a fixed list. No real name, phone number, birthdate, or GPS.',
  },
  {
    title: 'Your location never reaches our servers.',
    body: 'The map centers on your device, in your browser. Searches send the box you are looking at, nothing about you, and nothing per-user is logged about it.',
  },
  {
    title: 'Photos are stripped of metadata before upload.',
    body: 'Images are re-encoded on your device so camera and GPS data never leave it. Video is transcoded, and the original file is never served.',
  },
  {
    title: 'Everything defaults to private.',
    body: 'Posts go to friends by default. Public posting is a switch you turn on, then a choice per post. Place lists are private. RSVPs are private: the organizer sees who is coming, everyone else sees a count.',
  },
  {
    title: 'Messages are encrypted at rest and expire.',
    body: 'Direct messages are stored encrypted and deleted after 90 days. End-to-end encryption is on the roadmap and documented as an open decision.',
  },
  {
    title: 'The companion forgets.',
    body: `Conversations with ${SITE.companionName} are not stored unless you pin them, and unpinned ones expire after 24 hours. ${SITE.companionName} is told your handle and your stated interests, never your email, area, or friends.`,
  },
  {
    title: 'No third-party analytics.',
    body: 'No trackers, no advertising pixels, no analytics SDKs, no fonts from a CDN. We keep aggregate counts (how many places, how many events) and nothing per person.',
  },
  {
    title: 'Deleting your account deletes it.',
    body: 'One action in settings removes your account, sessions, friendships, RSVPs, posts, comments, reactions, messages, action log, and companion conversations. Places and reviews you submitted stay, detached from you.',
  },
  {
    title: 'The system is public. The people are not.',
    body: 'The code, the docs, the data inventory, and the roadmap are published so anyone can check these claims. Who is a member, who went where, and who talks to whom are not.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <Screen
      label="Privacy"
      title="The privacy promise"
      context="Privacy is the floor, not a feature. If a feature needs more data than it deserves, the feature changes, not this page."
      support={
        <>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">Verify it</p>
          <p className="text-muted-foreground">
            The field-by-field data inventory, retention periods, and threat model live in the{' '}
            <a
              href={`${SITE.docsUrl}/privacy`}
              className="text-vg-accent-2 hover:underline"
              rel="noreferrer"
            >
              public docs
            </a>
            . The source is at{' '}
            <a href={SITE.sourceUrl} className="text-vg-accent-2 hover:underline" rel="noreferrer">
              GitHub
            </a>
            .
          </p>
        </>
      }
    >
      <ol className="max-w-3xl space-y-6">
        {RULES.map((rule, index) => (
          <li key={rule.title} className="flex gap-4">
            <span className="mt-1 font-mono text-sm text-vg-primary" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className="font-medium">{rule.title}</h2>
              <p className="mt-1 leading-relaxed text-muted-foreground">{rule.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Screen>
  );
}
