import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmation, sendPaymentReceived } from "@/lib/email/send";
import {
  cngAmountToCents,
  fetchTransactionInfo,
  isTransactionProcessed,
} from "@/lib/cng";

export type CngSettleResult = {
  outcome: "paid" | "cancelled" | "error";
  invoiceId?: string;
  invoiceNumber?: string;
};

export async function settleCngReturn(input: {
  status?: string | null;
  orderNumber?: string | null;
  paymentId?: string | null;
}): Promise<CngSettleResult> {
  const status = (input.status || "").toUpperCase();
  const orderNumber = input.orderNumber;
  const paymentId = input.paymentId;

  const admin = createAdminClient();
  const { data: invoice } = orderNumber
    ? await admin
        .from("invoices")
        .select("*, customer:customers(email, full_name)")
        .eq("invoice_number", orderNumber)
        .single()
    : { data: null };

  if (status === "CANCELLED") {
    return {
      outcome: "cancelled",
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoice_number,
    };
  }

  if (!invoice) {
    return { outcome: "error" };
  }

  if (invoice.status === "paid") {
    return {
      outcome: "paid",
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
    };
  }

  const tx = await fetchTransactionInfo({
    paymentId,
    orderNumber: paymentId ? undefined : orderNumber,
  });

  if (!tx || !isTransactionProcessed(tx)) {
    console.error("CNG return: transaction not processed", { orderNumber, paymentId });
    return { outcome: "error", invoiceId: invoice.id, invoiceNumber: invoice.invoice_number };
  }

  if (tx.webOrderNumber && tx.webOrderNumber !== invoice.invoice_number) {
    console.error("CNG return: order number mismatch");
    return { outcome: "error", invoiceId: invoice.id, invoiceNumber: invoice.invoice_number };
  }

  if (invoice.cng_passphrase && tx.webPassphrase && tx.webPassphrase !== invoice.cng_passphrase) {
    console.error("CNG return: passphrase mismatch");
    return { outcome: "error", invoiceId: invoice.id, invoiceNumber: invoice.invoice_number };
  }

  if (cngAmountToCents(tx.amount) !== invoice.amount_cents) {
    console.error("CNG return: amount mismatch", tx.amount, invoice.amount_cents);
    return { outcome: "error", invoiceId: invoice.id, invoiceNumber: invoice.invoice_number };
  }

  const cngPaymentId = tx.specialId || paymentId || null;
  const paidAt = new Date().toISOString();

  const { data: updated, error: updateError } = await admin
    .from("invoices")
    .update({
      status: "paid",
      paid_at: paidAt,
      cng_payment_id: cngPaymentId,
    })
    .eq("id", invoice.id)
    .neq("status", "paid")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("CNG return: failed to mark invoice paid", updateError);
    return { outcome: "error", invoiceId: invoice.id, invoiceNumber: invoice.invoice_number };
  }

  if (updated) {
    const { error: paymentError } = await admin.from("invoice_payments").insert({
      invoice_id: invoice.id,
      amount_cents: invoice.amount_cents,
      status: "completed",
      paid_at: paidAt,
      provider: "cng",
      cng_payment_id: cngPaymentId,
      payment_platform: tx.cardType || tx.platformId || "card",
    });

    if (paymentError && paymentError.code !== "23505") {
      console.error("CNG return: failed to record payment", paymentError);
    }

    try {
      if (invoice.customer?.email) {
        await sendPaymentConfirmation({
          to: invoice.customer.email,
          customerName: invoice.customer.full_name,
          invoiceNumber: invoice.invoice_number,
          amount: invoice.amount_cents,
          currency: invoice.currency,
        });
      }
      await sendPaymentReceived({
        invoiceNumber: invoice.invoice_number,
        customerName: invoice.customer?.full_name ?? "Unknown",
        amount: invoice.amount_cents,
        currency: invoice.currency,
      });
    } catch (emailErr) {
      console.error("Failed to send payment emails:", emailErr);
    }
  }

  return {
    outcome: "paid",
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoice_number,
  };
}
