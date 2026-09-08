import { RecoverableErrorBoundary } from "@/components/error-boundary";
import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
    >
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <RecoverableErrorBoundary
          title="This sign-in step could not load."
          description="Try again, or return to the sign-in screen."
          homeHref="/login"
          homeLabel="Back to sign in"
          className="min-h-[20rem]"
        >
          {children}
        </RecoverableErrorBoundary>
      </div>
    </main>
  );
}
