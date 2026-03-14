"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
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

      const dest = profile?.role === "admin" ? "/dashboard" : "/portal";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-2xl font-bold text-zinc-900 dark:text-white mb-8 tracking-tight">
          A.M.T <span className="text-blue-600">Imports</span>
        </Link>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
            Sign in to access your account.
          </p>
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
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
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
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-3 py-2.5 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {message && (
              <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wider">Demo Accounts</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@amtimports.com");
                setPassword("admin123");
              }}
              className="w-full text-left rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">admin@amtimports.com</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded">Admin</span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Password: admin123</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("customer@test.com");
                setPassword("customer123");
              }}
              className="w-full text-left rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">customer@test.com</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">Customer</span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Password: customer123</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
