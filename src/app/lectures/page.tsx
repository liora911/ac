import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { fetchLectures } from "@/lib/server/lectures";
import LecturesPageClient from "./LecturesPageClient";

// Lazy load heavy components
const Lectures = dynamic(() => import("@/components/Lectures/Lectures"), {
  loading: () => (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  ),
});
const CreateLectureForm = dynamic(
  () => import("@/components/CreateLecture/create_lecture"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    ),
  }
);

export default async function LecturesPage() {
  const session = await getServerSession(authOptions);
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Fetch initial data on server
  const lectureCategoriesData = await fetchLectures();

  return (
    <LecturesPageClient
      lectureCategoriesData={lectureCategoriesData}
      isAuthorized={isAuthorized}
    />
  );
}
