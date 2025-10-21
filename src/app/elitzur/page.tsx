import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import ElitzurDashboard from "./ElitzurDashboard";

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Elitzur Admin
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {session ? (
                <>Welcome, {session.user?.name}.</>
              ) : (
                "Please sign in to access admin features."
              )}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <ElitzurDashboard />
        </div>
      </div>
    </div>
  );
}
