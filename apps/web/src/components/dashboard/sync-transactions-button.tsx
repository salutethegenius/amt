"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatBusinessDateTime } from "@/lib/time";

function localIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { fromDate: localIsoDate(from), toDate: localIsoDate(to) };
}

type SyncSummary = {
  synced: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};

export function SyncTransactionsButton({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  const router = useRouter();
  const initial = useMemo(defaultRange, []);
  const [fromDate, setFromDate] = useState(initial.fromDate);
  const [toDate, setToDate] = useState(initial.toDate);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSync() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/cng/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromDate, toDate }),
      });
      const data = (await res.json()) as SyncSummary & { message?: string };
      if (!res.ok) throw new Error(data.message || "Sync failed");

      const parts = [`${data.inserted} inserted`, `${data.updated} updated`];
      if (data.skipped) parts.push(`${data.skipped} skipped`);
      if (data.errors?.length) parts.push(`${data.errors.length} errors`);
      setMessage(`Synced ${data.synced} from CNG (${parts.join(", ")}).`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="cng-from" className="block text-xs font-medium text-zinc-500">
            From
          </label>
          <input
            id="cng-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="mt-1 w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="cng-to" className="block text-xs font-medium text-zinc-500">
            To
          </label>
          <input
            id="cng-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="mt-1 w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={onSync}
          disabled={loading}
          className="rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Syncing…" : "Sync from CNG"}
        </button>
      </div>
      <div className="text-sm text-zinc-500">
        {lastSyncedAt ? (
          <p>Last synced {formatBusinessDateTime(lastSyncedAt)}</p>
        ) : (
          <p>Not synced from CNG yet</p>
        )}
        {message && <p className="text-zinc-700 dark:text-zinc-300">{message}</p>}
        {error && <p className="text-red-700">{error}</p>}
      </div>
    </div>
  );
}
