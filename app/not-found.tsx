import { StandardErrorPage } from "@/components/error-page";
import { ERROR_PAGES, STANDARD_ERROR_ACTIONS } from "@/lib/error-pages";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Page not found",
  description: "The requested page could not be found.",
  canonical: null,
});

export default function NotFound() {
  return (
    <StandardErrorPage
      {...ERROR_PAGES.notFound}
      actions={STANDARD_ERROR_ACTIONS.site}
    />
  );
}
