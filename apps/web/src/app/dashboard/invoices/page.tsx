import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/types";
import type { Invoice, Customer } from "@/lib/types";
import Link from "next/link";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false });

  const list = (invoices ?? []) as (Invoice & { customer: Customer })[];

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create and manage customer invoices."
        actionLabel="New Invoice"
        actionHref="/dashboard/invoices/new"
      />

      {error ? (
        <p className="text-sm text-red-700">Could not load invoices. Try again shortly.</p>
      ) : list.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create your first invoice for a customer."
          actionLabel="New Invoice"
          actionHref="/dashboard/invoices/new"
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Invoice #</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden md:table-cell">Due Date</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400 hidden lg:table-cell">Created</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {list.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{inv.customer?.full_name}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {formatCents(inv.amount_cents, inv.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">
                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden lg:table-cell">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/invoices/${inv.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
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
