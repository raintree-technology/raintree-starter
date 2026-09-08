"use client";

import { useEffect } from "react";
import { StandardErrorPage } from "@/components/error-page";
import { ERROR_PAGES, STANDARD_ERROR_ACTIONS } from "@/lib/error-pages";

export default function AppError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  const retry = unstable_retry ?? reset;

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StandardErrorPage
      {...ERROR_PAGES.serverError}
      actions={STANDARD_ERROR_ACTIONS.app}
      reference={error.digest}
      onRetry={retry}
      surface="section"
    />
  );
}
