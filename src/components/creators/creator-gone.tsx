import Link from 'next/link';
import { Screen } from '@/components/screen';
import { buttonVariants } from '@/components/ui/button';
import { GONE_BODY, GONE_TITLE } from '@/lib/gone-document';
import { cn } from '@/lib/utils';

/** In-layout gone screen for client navigations. Document requests answer 410 from middleware. */
export function CreatorGone() {
  return (
    <Screen label="410" title={GONE_TITLE} context={GONE_BODY}>
      <Link href="/creators" className={cn(buttonVariants({ variant: 'outline' }))}>
        Back to creators
      </Link>
    </Screen>
  );
}
