"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { put } from "@vercel/blob";

export type UploadResult = {
  success: true;
  url: string;
  filename: string;
} | {
  success: false;
  error: string;
};

export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { success: false, error: "Authentication required" };
    }

    // Check authorization
    if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
      return { success: false, error: "Not authorized to upload files" };
    }

    const file = formData.get("file") as File | null;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // Validate file type
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const documentTypes = ["application/pdf"];
    const allowedTypes = [...imageTypes, ...documentTypes];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed."
      };
    }

    // Validate file size (max 5MB for images, max 50MB for PDFs)
    const isPdf = documentTypes.includes(file.type);
    const maxSize = isPdf ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: isPdf ? "File too large. Maximum size is 50MB." : "File too large. Maximum size is 5MB."
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return { success: true, url: blob.url, filename };
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error) {
      return { success: false, error: `Upload failed: ${error.message}` };
    }

    return { success: false, error: "Failed to upload file" };
  }
}
