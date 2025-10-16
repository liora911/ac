"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "AccessDenied") {
      setMessage("משתמש זה אינו מורשה גישה אנא נסה עם מייל אחר");
      alert("משתמש זה אינו מורשה גישה");
    }
  }, [searchParams]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage("");

    try {
      const result = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/",
      });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setMessage("משתמש זה אינו מורשה גישה אנא נסה עם מייל אחר");
          alert("משתמש זה אינו מורשה גישה");
        } else {
          setMessage("Error sending email. Please try again.");
          alert("שגיאה בשליחת המייל, נסה שוב מאוחר יותר");
        }
      } else {
        setMessage("Check your email for a magic login link!");
        alert("קישור התחברות נשלח למייל שלך, אנא בדוק את תיבת הדואר הנכנס שלך");
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
      alert("משהו השתבש, נסה שוב מאוחר יותר");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="p-4">טוען...</div>;
  }

  if (session) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">ברוך הבא!</h2>
        <p className="mb-4">
          משתמש מחובר:<strong>{session.user?.email}</strong>
        </p>
        <button
          onClick={() => signOut()}
          className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors cursor-pointer"
        >
          צא מהמערכת
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">התחבר למערכת</h2>

      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            כתובת מייל
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="הזן מייל"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isLoading ? "שולח.." : "שלח קישור למייל"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded ${
            message.includes("Check your email")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>תזין את המייל ונשלח לך אימות אליו</p>
        <p>אין צורך בסיסמאות</p>
      </div>
    </div>
  );
}
