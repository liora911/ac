import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma/prisma";
import { AdapterUser } from "next-auth/adapters";

const ALLOWED_EMAILS = [
  "avshalom@iyar.org.il",
  "yarinmster@gmail.com",
  "yakir@iyar.org.il",
];

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
      if (!user.email) {
        console.log("Sign-in blocked: No email provided");
        return false;
      }

      const isAllowed = ALLOWED_EMAILS.includes(user.email.toLowerCase());

      if (!isAllowed) {
        console.log(`Sign-in blocked: ${user.email} not in allowed list`);
        return false;
      }

      console.log(`Sign-in allowed: ${user.email}`);
      return true;
    },
  },
  pages: {
    signIn: "/elitzur",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },

  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "database",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

export const auth = NextAuth(authOptions);
