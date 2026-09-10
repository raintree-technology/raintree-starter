import { ArrowRight, Layers, ShieldCheck, Terminal } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/discovery";

const capabilities = [
  {
    title: "Accounts and workspaces",
    description:
      "Better Auth, organization membership, invitations, roles, projects, and account security are wired into one application.",
  },
  {
    title: "Server-side boundaries",
    description:
      "Verified sessions, authorization checks, separate database roles, and row-level security protect tenant data.",
  },
  {
    title: "Optional integrations",
    description:
      "Enable Stripe, OAuth, Resend, Upstash, passkeys, or AI features in starter.config.ts when your project needs them.",
  },
] as const;

export async function LandingPage() {
  "use cache";
  cacheLife("days");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: site.name,
    url: site.url,
    description: site.description,
    programmingLanguage: ["TypeScript", "TSX"],
    runtimePlatform: "Next.js",
    codeSampleType: "full application",
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is serialized as data and HTML delimiters are escaped.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
        }}
      />
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1520px] items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)] lg:px-10">
          <div className="max-w-4xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Next.js application starter
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-7xl">
              {site.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Start with accounts, workspaces, projects, and secure tenant
              boundaries. Configure optional billing, email, rate limiting,
              OAuth, passkeys, and AI integrations when you need them.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-border pb-4 text-sm font-medium">
              <Terminal className="h-4 w-4" />
              <span>Local setup</span>
            </div>
            <pre className="overflow-x-auto py-5 text-sm leading-7 text-card-foreground">
              <code>{`bun install --frozen-lockfile
cp .env.example .env
bun run db:migrate
bun run dev`}</code>
            </pre>
            <p className="border-t border-border pt-4 text-sm text-muted-foreground">
              Set the database URL and authentication secret before running
              migrations.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-10">
          <div className="flex max-w-3xl items-start gap-4">
            <Layers className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                One application, ready to adapt
              </h2>
              <p className="mt-3 text-muted-foreground">
                Clone the repository and change this application directly. No
                generator or profile selection is required.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {capabilities.map((capability) => (
              <article
                key={capability.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <ShieldCheck className="h-5 w-5" />
                <h3 className="mt-4 font-semibold tracking-tight">
                  {capability.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
