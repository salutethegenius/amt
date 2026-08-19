import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents, formatDate, paymentMethodLabel } from "@/lib/types";
import type { InvoicePayment, Invoice } from "@/lib/types";

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("invoice_payments")
    .select("*, invoice:invoices(*, customer:customers(full_name, email))")
    .order("created_at", { ascending: false });

  const list = (payments ?? []) as (InvoicePayment & {
    invoice: Invoice & { customer: { full_name: string; email: string } };
  })[];

  return (
    <div>
      <PageHeader title="Payments" description="View all payment transactions." />

      {list.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Payments will appear here when customers pay their invoices."
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Invoice</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Method</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {list.map((payment) => (
                  <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {payment.invoice?.invoice_number ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {payment.invoice?.customer?.full_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {formatCents(payment.amount_cents)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : payment.status === "failed"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">
                      {paymentMethodLabel(payment)}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden lg:table-cell">
                      {payment.paid_at ? formatDate(payment.paid_at) : formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
