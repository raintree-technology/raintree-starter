"use client";

import { useEffect } from "react";
import { StandardErrorPage } from "@/components/error-page";
import { ERROR_PAGES, STANDARD_ERROR_ACTIONS } from "@/lib/error-pages";

type ErrorProps = {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
};

export default function RootError({
  error,
  retry: retryAction,
  reset,
}: ErrorProps) {
  const retry = retryAction ?? reset;

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
