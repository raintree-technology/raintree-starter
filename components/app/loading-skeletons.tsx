import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

export function AppShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-64 shrink-0 flex-col gap-3 border-r bg-card/40 p-3 md:flex">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="mt-2 space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
            <Skeleton key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <div className="mt-auto space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b px-4 md:hidden">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-7 w-32" />
        </header>
        <main id="main-content" className="flex-1">
          <DashboardPageSkeleton />
        </main>
      </div>
    </div>
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="content-width py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="mt-8">
        <ProjectGridSkeleton />
      </div>
    </div>
  );
}

export function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="content-width py-8">
      <Skeleton className="mb-6 h-8 w-36" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex gap-2 md:w-48 md:flex-col">
          {Array.from({ length: 4 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
            <Skeleton key={index} className="h-9 w-24 rounded-lg md:w-full" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
            <div key={index} className="rounded-xl border p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-3 h-4 w-72 max-w-full" />
              <Skeleton className="mt-6 h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="content-width py-8">
      <Skeleton className="h-8 w-28" />
      <Skeleton className="mb-6 mt-2 h-4 w-64 max-w-full" />
      <div className="rounded-xl border">
        <div className="grid grid-cols-4 gap-4 border-b p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
            key={index}
            className="grid grid-cols-4 gap-4 border-b p-4 last:border-b-0"
          >
            {Array.from({ length: 4 }).map((_, cellIndex) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Fixed skeleton slots never reorder or retain user state.
              <Skeleton key={cellIndex} className="h-5 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OnboardingPageSkeleton() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
    >
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md rounded-xl border p-5">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </main>
  );
}

export function AuthFormSkeleton() {
  return (
    <div className="rounded-xl border p-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
