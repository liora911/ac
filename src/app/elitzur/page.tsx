import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import ElitzurDashboard from "./ElitzurDashboard";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/admin-login?callbackUrl=/elitzur");
  }

  // Check for ADMIN role
  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return <ElitzurDashboard />;
}
