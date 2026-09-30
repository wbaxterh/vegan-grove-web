/**
 * Structured data for crawlers. The payload is built from typed API data, never from user
 * input, and `<` is escaped so a title like `<script>` cannot close the tag early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized from typed data with `<` escaped above
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
