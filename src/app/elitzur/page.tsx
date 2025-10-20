import LoginForm from "@/components/Login/login";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import CategoryManager from "@/components/Category/CategoryManager";
import SignOutButton from "@/components/Auth/SignOutButton"; // Import SignOutButton

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4">
      {session ? (
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Category Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome, {session.user?.name}.
              </p>
            </div>
            <div className="ml-6">
              <SignOutButton />
            </div>
          </div>

          <div className="mt-8">
            <CategoryManager />
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      )}
    </div>
  );
}
