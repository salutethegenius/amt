import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPaymentConfirmation, sendPaymentReceived } from "@/lib/email/send";

export type CheckoutSessionRow = {
  id: string;
  invoice_id: string;
  status: string;
};

export async function settlePaidCheckout(
  supabase: SupabaseClient,
  session: CheckoutSessionRow
): Promise<{ alreadySettled: boolean }> {
  const alreadySettled = session.status === "completed";
  const now = new Date().toISOString();

  if (!alreadySettled) {
    const { error: sessionError } = await supabase
      .from("checkout_sessions")
      .update({
        status: "completed",
        completed_at: now,
      })
      .eq("id", session.id);
    if (sessionError) throw sessionError;
  }

  const { data: updated, error: invoiceError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: now,
    })
    .eq("id", session.invoice_id)
    .neq("status", "paid")
    .select("id, invoice_number, amount_cents, currency, customer:customers(email, full_name)")
    .maybeSingle();
  if (invoiceError) throw invoiceError;

  const { error: expireOthersError } = await supabase
    .from("checkout_sessions")
    .update({ status: "expired" })
    .eq("invoice_id", session.invoice_id)
    .eq("status", "pending")
    .neq("id", session.id);
  if (expireOthersError) throw expireOthersError;

  if (updated) {
    const customer = updated.customer as
      | { email?: string | null; full_name?: string | null }
      | { email?: string | null; full_name?: string | null }[]
      | null;
    const customerRow = Array.isArray(customer) ? customer[0] : customer;

    try {
      if (customerRow?.email) {
        await sendPaymentConfirmation({
          to: customerRow.email,
          customerName: customerRow.full_name ?? "Customer",
          invoiceNumber: updated.invoice_number,
          amount: updated.amount_cents,
          currency: updated.currency,
        });
      }
      await sendPaymentReceived({
        invoiceNumber: updated.invoice_number,
        customerName: customerRow?.full_name ?? "Unknown",
        amount: updated.amount_cents,
        currency: updated.currency,
      });
    } catch (emailErr) {
      console.error("Failed to send payment emails:", emailErr);
    }
  }

  return { alreadySettled };
}
