import { BookOpen } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ApiUnavailable, EmptyState } from '@/components/empty-state';
import { Screen } from '@/components/screen';
import { Badge } from '@/components/ui/badge';
import { loadList } from '@/lib/loaders';
import { GUIDE_CATEGORY_LABELS, type Guide, type GuideCategory } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Guides',
  description:
    'Outreach scripts, know your rights, vegan 101, sanctuary volunteering, and nutrition.',
};

export const revalidate = 60;

const CATEGORY_ORDER: GuideCategory[] = [
  'outreach',
  'rights',
  'sanctuary',
  'vegan101',
  'nutrition',
  'other',
];

export default async function GuidesPage() {
  const { items, unavailable } = await loadList<Guide>('/guides');
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    guides: items.filter((guide) => guide.category === category),
  })).filter((group) => group.guides.length > 0);

  return (
    <Screen
      label="Learn"
      title="Guides"
      context="Short, practical, editorial. What to say at an outreach table, what to do if you are stopped at a protest, how to spend a first day at a sanctuary."
    >
      {unavailable ? (
        <ApiUnavailable what="Guides" />
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No guides published yet"
          description="The first set covers outreach, rights, and sanctuary volunteering."
        />
      ) : (
        grouped.map((group) => (
          <section key={group.category}>
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-vg-primary">
              {GUIDE_CATEGORY_LABELS[group.category]}
            </h2>
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {group.guides.map((guide) => (
                <li key={guide.id}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{guide.title}</span>
                    <Badge variant="outline" className="shrink-0">
                      {GUIDE_CATEGORY_LABELS[guide.category]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Screen>
  );
}
