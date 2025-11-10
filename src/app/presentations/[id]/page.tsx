import React from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { fetchPresentation } from "@/lib/server/presentations";
import PresentationDetailClient from "./PresentationDetailClient";

export default async function PresentationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  const presentation = await fetchPresentation(id);

  if (!presentation) {
    notFound();
  }

  return (
    <PresentationDetailClient
      presentation={presentation}
      isAuthorized={!!isAuthorized}
    />
  );
}
