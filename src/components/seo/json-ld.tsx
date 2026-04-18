/**
 * Server-rendered <script type="application/ld+json"> helper.
 *
 * Escape `<` so a payload with a literal `</script>` substring can't
 * break out of the script element. JSON.stringify otherwise emits it
 * verbatim, which is a classic XSS vector even with structured data.
 */
export function JsonLd({
  schema,
  id,
}: {
  schema: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}) {
  const payload = JSON.stringify(schema).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      id={id}
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
