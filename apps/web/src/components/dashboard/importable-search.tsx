"use client";

import { useEffect, useRef, useState } from "react";
import type { ImportableSearchHit } from "@/lib/importable/types";

export function ImportableSearch({
  onSelect,
  placeholder = "Search Bahamas tariff items…",
}: {
  onSelect: (hit: ImportableSearchHit) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ImportableSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const handle = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/importable/search?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as { items?: ImportableSearchHit[]; message?: string };
        if (!res.ok) throw new Error(data.message || "Search failed");
        setHits(data.items ?? []);
        setOpen(true);
      } catch {
        setError("Could not search Importable");
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div ref={boxRef} className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {loading && <p className="mt-1 text-xs text-zinc-500">Searching…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {open && hits.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(hit);
                  setQuery(hit.description);
                  setOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <span className="font-medium text-zinc-900 dark:text-white">{hit.description}</span>
                {hit.attributes && (
                  <span className="text-xs text-zinc-500">{hit.attributes}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
