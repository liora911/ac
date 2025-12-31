import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import ElitzurDashboard from "./ElitzurDashboard";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-4 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              פאנל ניהול
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {session ? (
                <>ברוך הבא פרופ' אבשלום אליצור</>
              ) : (
                "Please sign in to access admin features."
              )}
            </p>
          </div>
        </div>

        <ElitzurDashboard />
      </div>
    </div>
  );
}
