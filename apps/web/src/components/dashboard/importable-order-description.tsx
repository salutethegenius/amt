"use client";

import { useState } from "react";
import { ImportableSearch } from "@/components/dashboard/importable-search";
import { formatLevy, formatRate } from "@/lib/importable/duty";
import type { ImportableItem, ImportableSearchHit } from "@/lib/importable/types";

function orderDescription(item: ImportableItem): string {
  const bits = [`HS ${item.tariff.code}`, formatRate(item.tariff.general_rate)];
  const levy = formatLevy(item.tariff.environmental_levy, item.tariff.environmental_levy_type);
  if (levy) bits.push(levy);
  const attr = item.attributes ? ` (${item.attributes})` : "";
  return `${item.description}${attr} — ${bits.join(", ")}`;
}

export function ImportableOrderDescription() {
  const [description, setDescription] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);

  async function onSelect(hit: ImportableSearchHit) {
    setLoadingItem(true);
    setHint(null);
    try {
      const res = await fetch(`/api/importable/items/${encodeURIComponent(hit.id)}`);
      const data = (await res.json()) as { item?: ImportableItem; message?: string };
      if (!res.ok || !data.item) throw new Error(data.message);
      setDescription(orderDescription(data.item));
      setHint(
        `${data.item.description} classified as ${data.item.tariff.code} (${formatRate(data.item.tariff.general_rate)}).`
      );
    } catch {
      setDescription(hit.description);
      setHint("Item added without tariff details.");
    } finally {
      setLoadingItem(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Classify with Importable
        </label>
        <ImportableSearch onSelect={onSelect} />
        {loadingItem && <p className="mt-1 text-xs text-zinc-500">Loading tariff…</p>}
        {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Package details, special instructions, or pick an Importable item above…"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
