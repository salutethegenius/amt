"use client";

import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/safe-next";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthShell, authButtonClass, authInputClass } from "@/components/auth/auth-shell";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [nextPath, setNextPath] = useState("/portal");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(safeNextPath(params.get("next")) ?? "/portal");
  }, []);

  const loginHref = nextPath !== "/portal" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({
      type: "ok",
      text: "Check your email to confirm your account, then sign in. Invoices billed to this email will show up automatically.",
    });
    setLoading(false);
  }

  return (
    <AuthShell title="Create an account" subtitle="Sign up to view invoices and pay online.">
      <form className="space-y-4" onSubmit={handleSignUp}>
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={authInputClass}
            required
            autoComplete="name"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href={loginHref} className="text-blue-600 hover:text-blue-700 font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
