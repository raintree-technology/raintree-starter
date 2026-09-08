import "server-only";
import type { Metadata } from "next";
import { features } from "@/lib/config";
import { site } from "@/lib/discovery";

const ogImageSize = {
  width: 1200,
  height: 630,
} as const;

export const siteOgImage = {
  url: "/opengraph-image",
  ...ogImageSize,
  alt: `${site.name} social preview`,
} as const;

const noIndexRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
} satisfies Metadata["robots"];

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  canonical?: NonNullable<Metadata["alternates"]>["canonical"];
  markdownPath?: string;
  imagePath?: string;
  imageAlt?: string;
  noIndex?: boolean;
  absoluteTitle?: boolean;
  openGraphTitle?: string;
};

function canonicalUrl(
  canonical: PageMetadataOptions["canonical"] | undefined,
): string | URL | undefined {
  if (canonical == null) return undefined;
  if (typeof canonical === "string" || canonical instanceof URL)
    return canonical;
  return canonical.url;
}

export function createPageMetadata({
  title,
  description,
  path,
  canonical,
  markdownPath,
  imagePath,
  imageAlt,
  noIndex = false,
  absoluteTitle = false,
  openGraphTitle,
}: PageMetadataOptions): Metadata {
  const canonicalPath = canonical === null ? null : (canonical ?? path);
  const openGraphUrl = canonicalUrl(canonical) ?? path ?? site.url;
  const socialTitle = openGraphTitle ?? title;
  const image = {
    ...siteOgImage,
    url: imagePath ?? siteOgImage.url,
    alt: imageAlt ?? `${socialTitle} - ${site.name}`,
  };

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: canonicalPath ?? null,
      ...(path
        ? {
            languages: {
              [site.language]: path,
            },
          }
        : {}),
      ...(markdownPath
        ? {
            types: {
              "text/markdown": markdownPath,
            },
          }
        : {}),
    },
    robots: noIndex || !features.seo ? noIndexRobots : undefined,
    openGraph: {
      title: socialTitle,
      description,
      url: openGraphUrl,
      siteName: site.name,
      locale: "en_US",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [image],
    },
  };
}

export function createNoIndexMetadata(
  options: Omit<PageMetadataOptions, "noIndex">,
): Metadata {
  return createPageMetadata({ ...options, noIndex: true });
}
