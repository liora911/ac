import { MetadataRoute } from "next";
import prisma from "@/lib/prisma/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://elitzur.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/articles`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/presentations`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/lectures`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic pages - Articles (only published)
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const articles = await prisma.article.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    });
    articlePages = articles.map((article: { id: string; updatedAt: Date }) => ({
      url: `${BASE_URL}/articles/${article.id}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error fetching articles for sitemap:", error);
  }

  // Dynamic pages - Lectures
  let lecturePages: MetadataRoute.Sitemap = [];
  try {
    const lectures = await prisma.lecture.findMany({
      select: { id: true, updatedAt: true },
    });
    lecturePages = lectures.map((lecture: { id: string; updatedAt: Date }) => ({
      url: `${BASE_URL}/lectures/${lecture.id}`,
      lastModified: lecture.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error fetching lectures for sitemap:", error);
  }

  // Dynamic pages - Presentations (only published)
  let presentationPages: MetadataRoute.Sitemap = [];
  try {
    const presentations = await prisma.presentation.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    });
    presentationPages = presentations.map((presentation: { id: string; updatedAt: Date }) => ({
      url: `${BASE_URL}/presentations/${presentation.id}`,
      lastModified: presentation.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error fetching presentations for sitemap:", error);
  }

  // Dynamic pages - Events (only published)
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const events = await prisma.event.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    });
    eventPages = events.map((event: { id: string; updatedAt: Date }) => ({
      url: `${BASE_URL}/events/${event.id}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error fetching events for sitemap:", error);
  }

  return [
    ...staticPages,
    ...articlePages,
    ...lecturePages,
    ...presentationPages,
    ...eventPages,
  ];
}
