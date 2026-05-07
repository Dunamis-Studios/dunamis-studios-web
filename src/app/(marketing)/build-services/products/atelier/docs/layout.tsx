import { AtelierDocsNav } from "@/components/marketing/atelier-docs-nav";
import { Container } from "@/components/ui/primitives";
import {
  ATELIER_DOCS_BASE_PATH,
  getAtelierDocsNavigation,
} from "@/lib/atelier-docs";

/**
 * Atelier docs layout. Wraps every doc page in the .lane-atelier
 * wrapper so accent tokens (oxblood) cascade, and renders the sidebar
 * navigation in a two-column layout on desktop.
 *
 * The marketing page sibling at `../page.tsx` already wraps itself in
 * .lane-atelier — both are sibling subtrees under
 * /build-services/products/atelier, neither nests inside the other,
 * so each independently sets up the lane wrapper.
 */
export default async function AtelierDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const groups = await getAtelierDocsNavigation();

  return (
    <div className="lane-atelier">
      <Container size="xl" className="py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
          <AtelierDocsNav
            groups={groups}
            overviewHref={ATELIER_DOCS_BASE_PATH}
            searchHref={`${ATELIER_DOCS_BASE_PATH}/search`}
          />
          <div className="min-w-0">{children}</div>
        </div>
      </Container>
    </div>
  );
}
