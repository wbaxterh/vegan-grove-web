import type { Metadata } from 'next';
import Link from 'next/link';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'Terms of use for Vegan Grove.',
};

// TODO(m2): replace this outline with reviewed terms before public launch.
const SECTIONS = [
  {
    title: 'What this is',
    body: `${SITE.name} is a community and activism platform for Southern California. Using it means agreeing to these terms and to the privacy promise.`,
  },
  {
    title: 'Your account',
    body: 'You are responsible for what happens under your handle. Keep your login to yourself. You can delete your account at any time from settings, and deletion is immediate and complete.',
  },
  {
    title: 'Conduct',
    body: 'Be kind to members and to animals. No harassment, no doxxing, no dunking. Organizers may remove content and members from their groves and events. Reports are reviewed by people.',
  },
  {
    title: 'Content you post',
    body: 'You keep what you post. You give the platform permission to show it to the audience you chose (friends, a grove, or public) and to remove it if it breaks these terms.',
  },
  {
    title: 'Places, events, and safety',
    body: 'Places and events are contributed by members and organizations. Verify details before you go. Actions in the real world are your decision and your responsibility.',
  },
  {
    title: 'Changes',
    body: 'When these terms change, the change is announced in the docs release notes before it takes effect.',
  },
] as const;

export default function TermsPage() {
  return (
    <Screen
      label="Terms"
      title="Terms of use"
      context={
        <div className="space-y-2">
          <Badge variant="outline" className="font-mono">
            Draft, not yet reviewed
          </Badge>
          <p>
            This is the working outline. The reviewed version replaces it before public launch, and
            the{' '}
            <Link href="/privacy" className="text-vg-accent-2 hover:underline">
              privacy promise
            </Link>{' '}
            is binding either way.
          </p>
        </div>
      }
    >
      <div className="max-w-3xl space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-heading text-lg font-medium">{section.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </Screen>
  );
}
