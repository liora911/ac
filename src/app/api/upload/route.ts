import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Next.js App Router route segment config
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds timeout for large uploads

export async function POST(request: NextRequest) {
  try {
    // Check content length before processing
    const contentLength = request.headers.get("content-length");
    const maxAllowedSize = 50 * 1024 * 1024; // 50MB

    if (contentLength && parseInt(contentLength) > maxAllowedSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 413 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check authorization
    if (!ALLOWED_EMAILS.includes(session.user.email.toLowerCase())) {
      return NextResponse.json(
        { error: "Not authorized to upload files" },
        { status: 403 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error("FormData parsing error:", formError);
      // This usually happens when the body size limit is exceeded
      return NextResponse.json(
        { error: "Failed to process upload. The file may be too large for the server limit." },
        { status: 413 }
      );
    }

    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const documentTypes = ["application/pdf"];
    const allowedTypes = [...imageTypes, ...documentTypes];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for images, max 50MB for PDFs)
    const isPdf = documentTypes.includes(file.type);
    const maxSize = isPdf ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isPdf ? "File too large. Maximum size is 50MB." : "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
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

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error("Upload error:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (
        error.message.includes("body exceeded") ||
        error.message.includes("too large") ||
        error.message.includes("Body exceeded")
      ) {
        return NextResponse.json(
          { error: "File too large. The server has a body size limit that was exceeded." },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
