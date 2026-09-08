"use client";

import { useEffect } from "react";
import { StandardErrorPage } from "@/components/error-page";
import { ERROR_PAGES, STANDARD_ERROR_ACTIONS } from "@/lib/error-pages";

export default function AppError({
  error,
  retry: retryAction,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  const retry = retryAction ?? reset;

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
