"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { linkByEmail, linkToUser, unlinkAccount } from "./actions";

interface AccountLinkSectionProps {
  customerId: string;
  customerEmail: string;
  linkedUserId: string | null;
  linkedEmail: string | null;
}

export function AccountLinkSection({
  customerId,
  customerEmail,
  linkedUserId,
  linkedEmail,
}: AccountLinkSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [manualEmail, setManualEmail] = useState("");

  async function handleAutoLink() {
    setLoading(true);
    setMessage(null);
    const result = await linkByEmail(customerId, customerEmail);
    if (result.success) {
      setMessage({
        type: "success",
        text: `Linked to portal account: ${result.linkedEmail}`,
      });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error! });
    }
    setLoading(false);
  }

  async function handleManualLink(e: React.FormEvent) {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    setLoading(true);
    setMessage(null);
    const result = await linkToUser(customerId, manualEmail.trim());
    if (result.success) {
      setMessage({
        type: "success",
        text: `Linked to portal account: ${result.linkedEmail}`,
      });
      setManualEmail("");
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error! });
    }
    setLoading(false);
  }

  async function handleUnlink() {
    setLoading(true);
    setMessage(null);
    const result = await unlinkAccount(customerId);
    if (result.success) {
      setMessage({ type: "success", text: "Account unlinked." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error! });
    }
    setLoading(false);
  }

  return (
    <div className="mt-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Portal Account
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Link this customer to a portal login. If they do not have an account yet,
          we send an invite email.
        </p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Current status */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Status:
          </span>
          {linkedUserId ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
              Linked to {linkedEmail ?? linkedUserId}
            </span>
          ) : (
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              Not linked
            </span>
          )}
        </div>

        {message && (
          <div
            className={`rounded-lg px-4 py-2.5 text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Auto link by customer email */}
        {!linkedUserId && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAutoLink}
              disabled={loading}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Inviting..." : `Invite / link (${customerEmail})`}
            </button>
          </div>
        )}

        {/* Unlink */}
        {linkedUserId && (
          <button
            type="button"
            onClick={handleUnlink}
            disabled={loading}
            className="rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            {loading ? "Unlinking..." : "Unlink Account"}
          </button>
        )}

        {/* Manual override */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Manual override
          </p>
          <form onSubmit={handleManualLink} className="flex gap-3">
            <input
              type="email"
              placeholder="Portal user email..."
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              required
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !manualEmail.trim()}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Linking..." : "Link to this user"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
