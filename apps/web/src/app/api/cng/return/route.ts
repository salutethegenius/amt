import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentConfirmation, sendPaymentReceived } from "@/lib/email/send";
import {
  cngAmountToCents,
  fetchTransactionInfo,
  isTransactionProcessed,
} from "@/lib/cng";

function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function invoiceRedirect(invoiceId: string, query: "paid" | "cancelled" | "error") {
  const url = new URL(`${siteOrigin()}/portal/invoices/${invoiceId}`);
  url.searchParams.set(query, "true");
  return NextResponse.redirect(url);
}

function invoicesRedirect(query: "cancelled" | "error") {
  const url = new URL(`${siteOrigin()}/portal/invoices`);
  url.searchParams.set(query, "true");
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const status = (incoming.searchParams.get("STATUS") || "").toUpperCase();
  const orderNumber = incoming.searchParams.get("ORDER_NUMBER");
  const paymentId = incoming.searchParams.get("PAYMENT_ID");

  try {
    const admin = createAdminClient();

    const { data: invoice } = orderNumber
      ? await admin
          .from("invoices")
          .select("*, customer:customers(email, full_name)")
          .eq("invoice_number", orderNumber)
          .single()
      : { data: null };

    if (status === "CANCELLED") {
      if (!invoice) return invoicesRedirect("cancelled");
      return invoiceRedirect(invoice.id, "cancelled");
    }

    if (!invoice) {
      return invoicesRedirect("error");
    }

    if (invoice.status === "paid") {
      return invoiceRedirect(invoice.id, "paid");
    }

    const tx = await fetchTransactionInfo({
      paymentId,
      orderNumber: paymentId ? undefined : orderNumber,
    });

    if (!tx || !isTransactionProcessed(tx)) {
      console.error("CNG return: transaction not processed", { orderNumber, paymentId });
      return invoiceRedirect(invoice.id, "error");
    }

    if (tx.webOrderNumber && tx.webOrderNumber !== invoice.invoice_number) {
      console.error("CNG return: order number mismatch");
      return invoiceRedirect(invoice.id, "error");
    }

    if (invoice.cng_passphrase && tx.webPassphrase && tx.webPassphrase !== invoice.cng_passphrase) {
      console.error("CNG return: passphrase mismatch");
      return invoiceRedirect(invoice.id, "error");
    }

    if (cngAmountToCents(tx.amount) !== invoice.amount_cents) {
      console.error("CNG return: amount mismatch", tx.amount, invoice.amount_cents);
      return invoiceRedirect(invoice.id, "error");
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
      return invoiceRedirect(invoice.id, "error");
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

    return invoiceRedirect(invoice.id, "paid");
  } catch (error) {
    console.error("CNG return error:", error);
    return invoicesRedirect("error");
  }
}
