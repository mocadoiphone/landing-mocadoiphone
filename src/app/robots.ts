import { type MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { createRobots } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return createRobots(siteConfig.indexingEnabled, siteConfig.url);
}
