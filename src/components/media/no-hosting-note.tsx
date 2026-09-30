/** The line every media screen carries: the library is a catalog, never a host. */
export function NoHostingNote() {
  return (
    <p
      data-testid="no-hosting-note"
      className="rounded-lg border border-border bg-card/60 p-4 font-mono text-xs leading-relaxed text-muted-foreground"
    >
      Vegan Grove does not host films. Every title links to where its makers or distributors publish
      it, trailers load from YouTube only when you ask, and nothing records what you watch.
    </p>
  );
}
