import React from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { fetchArticle } from "@/lib/server/articles";
import ArticleDetailClient from "./ArticleDetailClient";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const article = await fetchArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <ArticleDetailClient article={article} isAuthorized={!!isAuthorized} />
  );
}
