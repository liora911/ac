import { getServerSession } from "next-auth";

export interface AuthResult {
  session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    role: string;
  };
}

export interface AuthError {
  error: string;
  status: 401 | 403 | 404 | 500;
}
