import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionUpsertRow } from "./map";

export type UpsertAction = "inserted" | "updated";

type ExistingRow = {
  id: string;
  customer_ref: string | null;
  invoice_id: string | null;
};

export async function upsertTransactionRow(
  supabase: SupabaseClient,
  row: TransactionUpsertRow
): Promise<UpsertAction> {
  let existing: ExistingRow | null = null;

  if (row.cng_payment_id) {
    const { data, error } = await supabase
      .from("invoice_payments")
      .select("id, customer_ref, invoice_id")
      .eq("cng_payment_id", row.cng_payment_id)
      .maybeSingle();
    if (error) throw error;
    existing = data;
  }

  if (!existing && row.order_number) {
    const { data, error } = await supabase
      .from("invoice_payments")
      .select("id, customer_ref, invoice_id")
      .eq("order_number", row.order_number)
      .maybeSingle();
    if (error) throw error;
    existing = data;
  }

  const payload: Record<string, unknown> = {
    ...row,
    provider: "cng",
    payment_platform: row.card_type || row.payment_method,
  };

  if (row.processed) {
    payload.paid_at = row.cng_created_at || new Date().toISOString();
  }

  if (existing?.customer_ref) {
    payload.customer_ref = existing.customer_ref;
  }
  if (existing?.invoice_id && !row.invoice_id) {
    payload.invoice_id = existing.invoice_id;
  }
  if (!row.synced_at) {
    delete payload.synced_at;
  }

  if (existing) {
    const { error } = await supabase
      .from("invoice_payments")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    if (row.cng_created_at) {
      payload.created_at = row.cng_created_at;
    }
    const { error } = await supabase.from("invoice_payments").insert(payload);
    if (error) throw error;
  }

  const invoiceId = (payload.invoice_id as string | null) ?? row.invoice_id;
  if (invoiceId && row.cng_payment_id) {
    const { error: invoiceError } = await supabase
      .from("invoices")
      .update({ cng_payment_id: row.cng_payment_id })
      .eq("id", invoiceId);
    if (invoiceError) throw invoiceError;
  }

  return existing ? "updated" : "inserted";
}
