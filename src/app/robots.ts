import { MetadataRoute } from "next";
import { BASE_URL } from "@/constants/app";

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
