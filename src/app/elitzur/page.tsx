import LoginForm from "@/components/Login/login";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
