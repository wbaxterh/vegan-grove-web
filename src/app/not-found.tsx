import Link from 'next/link';
import { SectionLabel } from '@/components/section-label';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-start justify-center px-6">
      <SectionLabel>404</SectionLabel>
      <h1 className="mt-3 font-heading text-3xl font-semibold">Nothing grows here</h1>
      <p className="mt-3 text-muted-foreground">
        That page does not exist, or it belongs to a member and is not public.
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'mt-8')}>
        Back to the grove
      </Link>
    </main>
  );
}
