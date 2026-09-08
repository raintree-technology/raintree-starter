import { ArrowRight, Check, Layers, ShieldCheck, Terminal } from "lucide-react";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/discovery";
import { ADDONS, WEBSITE_SPEC_SOURCE } from "@/lib/scaffold/addons";
import {
  WEBSITE_SPEC_ITEM_COUNT,
  websiteSpecCategoryCounts,
  websiteSpecLevelCounts,
} from "@/lib/scaffold/website-spec";

const featuredAddons = ADDONS.filter((addon) =>
  [
    "better-auth",
    "stripe",
    "neon",
    "seo",
    "agent-readiness",
    "resend",
    "upstash",
    "ai",
  ].includes(addon.id),
);
const specCategories = websiteSpecCategoryCounts();
const specLevelCounts = websiteSpecLevelCounts();

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
    codeSampleType: "scaffold",
    targetProduct: {
      "@type": "SoftwareApplication",
      name: "Generated Next.js application",
      applicationCategory: "DeveloperApplication",
    },
    isBasedOn: WEBSITE_SPEC_SOURCE,
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
              Spec-aligned scaffolding
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-foreground md:text-7xl">
              {site.name}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
              Generate a Next.js app with only the add-ons you need: Better
              Auth, Stripe, Neon, SEO, agent discovery, email, rate limiting,
              AI, and the production website defaults from the Website
              Specification.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="#cli">
                  Scaffold an app
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/llms.txt">View machine-readable index</Link>
              </Button>
            </div>
          </div>

          <div
            id="cli"
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-border pb-4 text-sm font-medium">
              <Terminal className="h-4 w-4" />
              <span>scaffold command</span>
            </div>
            <pre className="overflow-x-auto py-5 text-sm leading-7 text-card-foreground">
              <code>{`bun run create -- \\
  --dir ../acme \\
  --name Acme \\
  --addons better-auth,stripe,neon,seo,agent-readiness`}</code>
            </pre>
            <div className="grid gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:grid-cols-3">
              <span>Config written</span>
              <span>Env scaffolded</span>
              <span>Docs generated</span>
            </div>
          </div>
        </div>
      </section>

      <section id="addons" className="border-b border-border py-16">
        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-10">
          <div className="flex max-w-3xl items-start gap-4">
            <Layers className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Optional add-ons
              </h2>
              <p className="mt-3 text-muted-foreground">
                The catalog is the source of truth for the CLI, generated
                config, docs, and public site. Dependencies are resolved
                automatically, so selecting Stripe brings in Better Auth and
                Neon.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredAddons.map((addon) => (
              <article
                key={addon.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold tracking-tight">
                    {addon.label}
                  </h3>
                  <span className="shrink-0 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
                    {addon.category}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {addon.summary}
                </p>
                {addon.dependencies.length > 0 && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Depends on {addon.dependencies.join(", ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="website-spec" className="py-16">
        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-10">
          <div className="flex max-w-3xl items-start gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0" />
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Website Specification baseline
              </h2>
              <p className="mt-3 text-muted-foreground">
                Generated projects track all {WEBSITE_SPEC_ITEM_COUNT} current
                checklist items:
                {` ${specLevelCounts.Required}`} required,{" "}
                {specLevelCounts.Recommended} recommended,
                {` ${specLevelCounts.Optional}`} optional, and{" "}
                {specLevelCounts.Avoid} avoid items. Optional protocols stay
                documented until a project has a real use case.
              </p>
            </div>
          </div>

          <div className="mt-10 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Website Specification category coverage
              </caption>
              <thead className="bg-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Items
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Scaffold posture
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Default
                  </th>
                </tr>
              </thead>
              <tbody>
                {specCategories.map((category) => (
                  <tr key={category.id} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-medium">
                      {category.label}
                    </th>
                    <td className="px-4 py-3">{category.itemCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {category.summary}
                    </td>
                    <td className="px-4 py-3">
                      {category.scaffoldDefault ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium">
                          <Check className="h-4 w-4" />
                          Included
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Opt-in</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}
