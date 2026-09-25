import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_PAGES } from "@/lib/site";

export const dynamic = "force-static";

/** sitemap.xml : les pages publiques indexables (la page /cv, source du PDF, en est exclue). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_PAGES.map((p) => ({
    url: absoluteUrl(p.path),
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
