"use client";

import {
  type ComponentPropsWithoutRef,
  forwardRef,
  type ReactNode,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getErrorMessage } from "@/lib/utils";

type AuthClientError = { message?: string | null } | null | undefined;

type AuthFieldProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  labelAction?: ReactNode;
  /** Inline field error; announced and associated with the input. */
  error?: string | null;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ id, label, description, labelAction, error, name, ...props }, ref) => {
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
      [errorId, descriptionId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-2">
        {labelAction ? (
          <div className="flex items-center justify-between">
            <Label htmlFor={id}>{label}</Label>
            {labelAction}
          </div>
        ) : (
          <Label htmlFor={id}>{label}</Label>
        )}
        <Input
          id={id}
          name={name ?? id}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
        {description ? (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";

export function AuthDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

export function AuthLoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  className,
  ...props
}: ButtonProps & {
  loading: boolean;
  loadingText: string;
  children: ReactNode;
}) {
  return (
    <Button
      className={cn("w-full", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? loadingText : children}
    </Button>
  );
}

export function useAuthAction() {
  const running = useRef(false);
  const [loading, setLoading] = useState(false);

  async function run(task: () => Promise<void>, fallbackMessage: string) {
    if (running.current) return;

    running.current = true;
    setLoading(true);
    try {
      await task();
    } catch (error) {
      toast.error(getErrorMessage(error, fallbackMessage));
    } finally {
      running.current = false;
      setLoading(false);
    }
  }

  return { loading, run };
}

export function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function toastAuthError(
  error: AuthClientError,
  fallbackMessage: string,
) {
  toast.error(error?.message ?? fallbackMessage);
}
