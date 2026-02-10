import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import ElitzurDashboard from "./ElitzurDashboard";
import UnauthorizedScreen from "@/components/Auth/UnauthorizedScreen";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/admin-login?callbackUrl=/elitzur");
  }

  // Non-admin users get the scary screen
  if (session.user.role !== "ADMIN") {
    return <UnauthorizedScreen />;
  }

  return <ElitzurDashboard />;
}
