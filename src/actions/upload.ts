"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    // Return the public URL
    const url = `/uploads/${filename}`;

    return { success: true, url, filename };
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof Error) {
      return { success: false, error: `Upload failed: ${error.message}` };
    }

    return { success: false, error: "Failed to upload file" };
  }
}
