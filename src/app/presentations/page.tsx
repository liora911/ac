import React, { Suspense } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { fetchPresentations } from "@/lib/server/presentations";
import PresentationsPageClient from "./PresentationsPageClient";

// Lazy load heavy components
const CreatePresentationForm = dynamic(
  () => import("@/components/CreatePresentation/create_presentation"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    ),
  }
);
const Modal = dynamic(() => import("@/components/Modal/Modal"), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded" />,
});

export default async function PresentationsPage() {
  const session = await getServerSession(authOptions);
  const isAuthorized: boolean =
    !!session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  // Fetch initial data on server
  const presentationCategoriesData = await fetchPresentations();

  // Select a random category with presentations for initial banner
  let initialSelectedCategoryId = null;
  let initialBannerUrl = null;
  let initialBannerAlt = "Banner Image";

  if (presentationCategoriesData.length > 0) {
    const categoriesWithPresentations = presentationCategoriesData.filter(
      (category) => category.presentations.length > 0
    );
    if (categoriesWithPresentations.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * categoriesWithPresentations.length
      );
      const randomCategory = categoriesWithPresentations[randomIndex];
      initialSelectedCategoryId = randomCategory.id;
      initialBannerUrl = randomCategory.bannerImageUrl;
      initialBannerAlt = randomCategory.name;
    }
  }

  return (
    <PresentationsPageClient
      presentationCategoriesData={presentationCategoriesData}
      initialSelectedCategoryId={initialSelectedCategoryId}
      initialBannerUrl={initialBannerUrl}
      initialBannerAlt={initialBannerAlt}
      isAuthorized={isAuthorized}
    />
  );
}
