import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/auth";
import { hasAnyAdminAccess } from "@/constants/permissions";
import ElitzurDashboard from "./ElitzurDashboard";
import UnauthorizedScreen from "@/components/Auth/UnauthorizedScreen";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/admin-login?callbackUrl=/elitzur");
  }

  // Full admins and section managers both reach the dashboard; the dashboard
  // itself only reveals the sections each user is permitted to manage.
  if (!hasAnyAdminAccess(session.user)) {
    return <UnauthorizedScreen />;
  }

  return <ElitzurDashboard />;
}
