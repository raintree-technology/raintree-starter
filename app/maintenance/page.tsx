import { Logo } from "@/components/logo";
import { features } from "@/lib/config";
import { createNoIndexMetadata } from "@/lib/metadata";

export const metadata = createNoIndexMetadata({
  title: "Maintenance",
  description:
    "The app is temporarily unavailable during scheduled maintenance.",
  path: "/maintenance",
});

export default function MaintenancePage() {
  return (
    <main
      id="main-content"
      className="content-width grid min-h-dvh place-items-center py-20"
    >
      <section className="max-w-xl">
        <Logo className="mb-10" />
        <h1 className="text-4xl font-semibold tracking-tight">
          Maintenance in progress
        </h1>
        <p className="mt-4 text-muted-foreground">
          {features.appName} is temporarily unavailable while scheduled work is
          completed. Please try again shortly.
        </p>
      </section>
    </main>
  );
}
