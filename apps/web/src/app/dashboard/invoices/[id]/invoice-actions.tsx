"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceStatus } from "@/lib/types";

export function InvoiceActions({
  invoiceId,
  status,
  amountCents,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  customerEmail?: string;
  amountCents: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function sendInvoice() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", invoiceId);

    if (updateError) {
      setError("Failed to update invoice status");
      setLoading(false);
      return;
    }

    try {
      await fetch("/api/notify/invoice-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
    } catch {
      // best-effort email notification
    }

    setLoading(false);
    router.refresh();
  }

  async function markPaid() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", invoiceId);

    if (updateError) {
      setError("Failed to mark invoice as paid");
      setLoading(false);
      return;
    }

    const { error: paymentError } = await supabase.from("invoice_payments").insert({
      invoice_id: invoiceId,
      amount_cents: amountCents,
      status: "completed",
      paid_at: new Date().toISOString(),
      provider: "manual",
    });

    if (paymentError) {
      console.error("Failed to record payment:", paymentError);
    }

    setLoading(false);
    router.refresh();
  }

  if (status === "paid" || status === "cancelled") return null;

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="flex gap-2">
      {(status === "draft") && (
        <button
          onClick={sendInvoice}
          disabled={loading}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send to Customer"}
        </button>
      )}
      {(status === "sent" || status === "overdue") && (
        <>
          <button
            onClick={sendInvoice}
            disabled={loading}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Resend
          </button>
          <button
            onClick={markPaid}
            disabled={loading}
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Mark as Paid
          </button>
        </>
      )}
      </div>
    </div>
  );
}
