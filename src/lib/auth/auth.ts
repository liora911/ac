import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma/prisma";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { UserRole } from "@prisma/client";

// Extended session user type with role and subscription
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      hasActiveSubscription: boolean;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@example.com",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        // Fetch user role and subscription status from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            subscription: {
              select: { status: true },
            },
          },
        });

        session.user.id = user.id;
        session.user.role = dbUser?.role || UserRole.USER;
        session.user.hasActiveSubscription =
          dbUser?.subscription?.status === "ACTIVE";
      }
      return session;
    },
    async signIn({ user }) {
      // Allow all users with valid email to sign in
      return !!user.email;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-assign ADMIN role to whitelisted emails on first login
      if (user.email && ALLOWED_EMAILS.includes(user.email)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: UserRole.ADMIN },
        });
      }
    },
  },
  pages: {
    signIn: "/auth/login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "database",
  },
};
