import LoginForm from "@/components/Login/login";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import CategoryManager from "@/components/Category/CategoryManager";
import { signOut } from "next-auth/react"; // Import signOut

export default async function Page() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      {session ? (
        <>
          <h1 className="text-4xl font-bold mb-8">Category Management</h1>
          <p className="mb-4">Welcome, {session.user?.name}!</p>
          <CategoryManager />
          <button
            onClick={() => signOut()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign out
          </button>
        </>
      ) : (
        <Suspense>
          <LoginForm />
        </Suspense>
      )}
    </div>
  );
}
