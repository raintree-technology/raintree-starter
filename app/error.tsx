"use client";

import { useEffect } from "react";
import { StandardErrorPage } from "@/components/error-page";
import { ERROR_PAGES, STANDARD_ERROR_ACTIONS } from "@/lib/error-pages";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
};

export default function RootError({
  error,
  unstable_retry,
  reset,
}: ErrorProps) {
  const retry = unstable_retry ?? reset;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StandardErrorPage
      {...ERROR_PAGES.serverError}
      actions={STANDARD_ERROR_ACTIONS.site}
      reference={error.digest}
      onRetry={retry}
    />
  );
}
