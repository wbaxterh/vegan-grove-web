import Link from 'next/link';
import { SITE } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 font-mono text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Open about the system, closed about the people. No analytics, no trackers.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a href={SITE.docsUrl} className="hover:text-foreground" rel="noreferrer">
            Docs
          </a>
          <a href={SITE.sourceUrl} className="hover:text-foreground" rel="noreferrer">
            Source
          </a>
        </nav>
      </div>
    </footer>
  );
}
