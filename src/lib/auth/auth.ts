import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma/prisma";
import { AdapterUser } from "next-auth/adapters";
import { ALLOWED_EMAILS } from "@/constants/auth";

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
        (session.user as AdapterUser).id = user.id;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      return ALLOWED_EMAILS.includes(user.email);
    },
  },
  pages: {
    signIn: "/auth/admin-login",
    verifyRequest: "/auth/verify-request",
    error: "/auth/admin-login",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "database",
  },
};
