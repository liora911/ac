import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elitzur.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/elitzur/",
          "/edit-article/",
          "/edit-lecture/",
          "/edit-presentation/",
          "/edit-event/",
          "/create-lecture/",
          "/create-presentation/",
          "/create-event/",
          "/ticket-summary/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
