import LoginForm from "@/components/Login/login";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import CategoryManager from "@/components/Category/CategoryManager";
import SignOutButton from "@/components/Auth/SignOutButton"; // Import SignOutButton

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      {session ? (
        <>
          <h1 className="text-4xl font-bold mb-8">Category Management</h1>
          <p className="mb-4">Welcome, {session.user?.name}!</p>
          <CategoryManager />
          <SignOutButton />
        </>
      ) : (
        <Suspense>
          <LoginForm />
        </Suspense>
      )}
    </div>
  );
}
