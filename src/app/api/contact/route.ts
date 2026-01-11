import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { rateLimiters, getClientIP } from "@/lib/rate-limit/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 requests per 15 minutes per IP
    const ip = getClientIP(request);
    const rateLimitResult = rateLimiters.contact(ip);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many messages sent. Please wait before sending another.",
          retryAfter: Math.ceil(rateLimitResult.resetIn / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimitResult.resetIn / 1000)),
          },
        }
      );
    }

    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (subject.trim().length < 5) {
      return NextResponse.json(
        { error: "Subject must be at least 5 characters long" },
        { status: 400 }
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters long" },
        { status: 400 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    return NextResponse.json(
      { message: "Contact form submitted successfully", id: newMessage.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving contact message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
