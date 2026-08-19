import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { InvoiceStatusBadge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/types";
import type { Invoice, InvoiceItem } from "@/lib/types";
import Link from "next/link";
import { PayButton } from "./pay-button";

export default async function PortalInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; cancelled?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: customerRecord } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .single();

  if (!customerRecord) notFound();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .eq("customer_id", customerRecord.id)
    .single();

  if (!invoice) notFound();

  const inv = invoice as Invoice & { invoice_items: InvoiceItem[] };
  const canPay = inv.status === "sent" || inv.status === "overdue";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/portal/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Invoices
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{inv.invoice_number}</h1>
                <InvoiceStatusBadge status={inv.status} />
              </div>
              <p className="text-sm text-zinc-500">
                Issued {formatDate(inv.created_at)}
                {inv.due_date && <> &middot; Due {formatDate(inv.due_date)}</>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {formatCents(inv.amount_cents, inv.currency)}
              </p>
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left px-6 py-3 font-medium text-zinc-500">Description</th>
                <th className="text-right px-6 py-3 font-medium text-zinc-500">Qty</th>
                <th className="text-right px-6 py-3 font-medium text-zinc-500">Price</th>
                <th className="text-right px-6 py-3 font-medium text-zinc-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {inv.invoice_items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3 text-zinc-900 dark:text-white">{item.description}</td>
                  <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">{item.quantity}</td>
                  <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400">
                    {formatCents(item.unit_price_cents)}
                  </td>
                  <td className="px-6 py-3 text-right font-medium text-zinc-900 dark:text-white">
                    {formatCents(item.quantity * item.unit_price_cents)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-white">
                  Total
                </td>
                <td className="px-6 py-4 text-right text-lg font-bold text-zinc-900 dark:text-white">
                  {formatCents(inv.amount_cents, inv.currency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {query.cancelled === "true" && canPay && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-amber-50 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
              Payment was cancelled. You can try again when you are ready.
            </p>
          </div>
        )}

        {query.error === "true" && canPay && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-400">
              We could not confirm this payment. If you were charged, contact A.M.T Imports.
            </p>
          </div>
        )}

        {canPay && (
          <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <PayButton invoiceId={inv.id} />
          </div>
        )}

        {(inv.status === "paid" || query.paid === "true") && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-green-50 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">
              {inv.paid_at ? `Paid on ${formatDate(inv.paid_at)}` : "Payment received."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
