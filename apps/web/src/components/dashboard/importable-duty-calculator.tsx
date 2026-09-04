"use client";

import { useMemo, useState } from "react";
import { ImportableSearch } from "@/components/dashboard/importable-search";
import { calculateDuty, formatLevy, formatRate } from "@/lib/importable/duty";
import { parseDollarsToCents } from "@/lib/money";
import { formatCents } from "@/lib/types";
import type { ImportableItem, ImportableSearchHit } from "@/lib/importable/types";

export interface DutyLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export function ImportableDutyCalculator({
  onAddLines,
}: {
  onAddLines: (lines: DutyLineItem[]) => void;
}) {
  const [item, setItem] = useState<ImportableItem | null>(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState("0.00");
  const [quantity, setQuantity] = useState(1);
  const [freight, setFreight] = useState("0.00");
  const [includeVat, setIncludeVat] = useState(true);

  async function onSelect(hit: ImportableSearchHit) {
    setLoadingItem(true);
    setError(null);
    try {
      const res = await fetch(`/api/importable/items/${encodeURIComponent(hit.id)}`);
      const data = (await res.json()) as { item?: ImportableItem; message?: string };
      if (!res.ok || !data.item) throw new Error(data.message);
      setItem(data.item);
    } catch {
      setItem(null);
      setError("Could not load that tariff item");
    } finally {
      setLoadingItem(false);
    }
  }

  const unitValueCents = parseDollarsToCents(value) ?? 0;
  const freightCents = parseDollarsToCents(freight) ?? 0;
  const breakdown = useMemo(() => {
    if (!item) return null;
    return calculateDuty({
      unitValueCents,
      quantity,
      freightCents,
      includeVat,
      tariff: item.tariff,
    });
  }, [item, unitValueCents, quantity, freightCents, includeVat]);

  function addCharges() {
    if (!item || !breakdown) return;
    const lines: DutyLineItem[] = [];
    if (breakdown.dutyCents > 0) {
      lines.push({
        description: `Customs duty — ${item.description} (HS ${item.tariff.code}, ${formatRate(item.tariff.general_rate)})`,
        quantity: 1,
        unit_price_cents: breakdown.dutyCents,
      });
    }
    if (breakdown.processingFeeCents > 0) {
      lines.push({
        description: "Customs processing fee",
        quantity: 1,
        unit_price_cents: breakdown.processingFeeCents,
      });
    }
    if (breakdown.levyCents > 0) {
      const levy = formatLevy(item.tariff.environmental_levy, item.tariff.environmental_levy_type);
      lines.push({
        description: `Environmental levy${levy ? ` — ${levy}` : ""}`,
        quantity: 1,
        unit_price_cents: breakdown.levyCents,
      });
    }
    if (breakdown.freightCents > 0) {
      lines.push({
        description: "Freight",
        quantity: 1,
        unit_price_cents: breakdown.freightCents,
      });
    }
    if (breakdown.vatCents > 0) {
      lines.push({
        description: "VAT 10%",
        quantity: 1,
        unit_price_cents: breakdown.vatCents,
      });
    }
    if (lines.length === 0) {
      setError("No billable charges for this classification (duty free and no levy).");
      return;
    }
    onAddLines(lines);
  }

  const levyLabel = item
    ? formatLevy(item.tariff.environmental_levy, item.tariff.environmental_levy_type)
    : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Importable duty lookup</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Search a classified item, enter declared value, and add Bahamas duty, processing, levy, and VAT as invoice lines.
        </p>
      </div>

      <ImportableSearch onSelect={onSelect} />
      {loadingItem && <p className="text-xs text-zinc-500">Loading tariff…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {item && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-medium">{item.description}</span>
          {item.attributes ? ` (${item.attributes})` : ""} — HS {item.tariff.code},{" "}
          {formatRate(item.tariff.general_rate)}
          {levyLabel ? `, ${levyLabel}` : ""}
        </p>
      )}

      <div className="grid sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="importable-value" className="block text-xs font-medium text-zinc-500 mb-1">
            Declared value ($)
          </label>
          <input
            id="importable-value"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!item}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="importable-qty" className="block text-xs font-medium text-zinc-500 mb-1">
            Qty
          </label>
          <input
            id="importable-qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={!item}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="importable-freight" className="block text-xs font-medium text-zinc-500 mb-1">
            Freight ($)
          </label>
          <input
            id="importable-freight"
            type="text"
            inputMode="decimal"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
            disabled={!item}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={includeVat}
          onChange={(e) => setIncludeVat(e.target.checked)}
          disabled={!item}
        />
        Include 10% VAT on value + government charges + freight
      </label>

      {breakdown && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-zinc-500">Declared value</dt>
          <dd className="text-right">{formatCents(breakdown.declaredValueCents)}</dd>
          <dt className="text-zinc-500">Duty</dt>
          <dd className="text-right">{formatCents(breakdown.dutyCents)}</dd>
          <dt className="text-zinc-500">Processing fee</dt>
          <dd className="text-right">{formatCents(breakdown.processingFeeCents)}</dd>
          <dt className="text-zinc-500">Environmental levy</dt>
          <dd className="text-right">{formatCents(breakdown.levyCents)}</dd>
          {breakdown.freightCents > 0 && (
            <>
              <dt className="text-zinc-500">Freight</dt>
              <dd className="text-right">{formatCents(breakdown.freightCents)}</dd>
            </>
          )}
          {includeVat && (
            <>
              <dt className="text-zinc-500">VAT 10%</dt>
              <dd className="text-right">{formatCents(breakdown.vatCents)}</dd>
            </>
          )}
          <dt className="font-semibold text-zinc-900 dark:text-white pt-1">Charges to invoice</dt>
          <dd className="text-right font-semibold pt-1">{formatCents(breakdown.totalChargesCents)}</dd>
        </dl>
      )}

      <button
        type="button"
        onClick={addCharges}
        disabled={!item || !breakdown}
        className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        Add charges to invoice
      </button>
      <p className="text-[11px] text-zinc-400">
        Declared value is used for the calculation only — it is not added as a line unless you type it yourself.
      </p>
    </div>
  );
}
