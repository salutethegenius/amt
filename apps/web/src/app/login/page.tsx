"use client";

import { createClient } from "@/lib/supabase/client";
import { postLoginPath, safeNextPath } from "@/lib/auth/safe-next";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthShell, authButtonClass, authInputClass } from "@/components/auth/auth-shell";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "auth") {
      setMessage({ type: "error", text: "Sign-in link expired or is invalid. Try again." });
    }
    setNextPath(safeNextPath(params.get("next")));
  }, []);

  const signupHref = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup";

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      router.push(postLoginPath(profile?.role, nextPath));
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access your account.">
      <form className="space-y-4" onSubmit={handleSignIn}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
            required
            autoComplete="current-password"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500">
        <Link href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
          Forgot password?
        </Link>
        <p>
          Need an account?{" "}
          <Link href={signupHref} className="text-blue-600 hover:text-blue-700 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
