import { startOfDayInTimeZone } from "@/lib/time";

export function paymentSortTime(row: {
  cng_created_at?: string | null;
  created_at: string;
}): number {
  return new Date(row.cng_created_at || row.created_at).getTime();
}

export function revenueCents(row: {
  amount_cents: number | null;
  net_cents?: number | null;
}): number {
  if (row.net_cents != null) return row.net_cents;
  return row.amount_cents ?? 0;
}

export function todaysPaymentTotals(
  rows: Array<{
    amount_cents: number | null;
    net_cents?: number | null;
    fee_cents?: number | null;
    created_at: string;
    cng_created_at?: string | null;
    status: string;
  }>,
  now = new Date()
): { revenueCents: number; feesCents: number } {
  const startMs = startOfDayInTimeZone(now).getTime();
  let revenue = 0;
  let fees = 0;
  for (const row of rows) {
    if (row.status !== "completed") continue;
    const when = row.cng_created_at || row.created_at;
    if (!when || new Date(when).getTime() < startMs) continue;
    revenue += revenueCents(row);
    fees += row.fee_cents ?? 0;
  }
  return { revenueCents: revenue, feesCents: fees };
}
