import { createClient } from "@/lib/supabase/server";
import { resolvePortalCustomerId } from "@/lib/auth/resolve-customer";
import { PortalAccountPending } from "@/app/portal/account-pending";
import { InvoiceStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCents, formatDate } from "@/lib/types";
import type { Invoice } from "@/lib/types";
import Link from "next/link";

export default async function PortalInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; error?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await resolvePortalCustomerId(user);

  if (!customerId) {
    return <PortalAccountPending title="My Invoices" />;
  }

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const list = (invoices ?? []) as Invoice[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">My Invoices</h1>

      {query.cancelled === "true" && (
        <p className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-400">
          Payment was cancelled. Open an unpaid invoice to try again.
        </p>
      )}
      {query.error === "true" && (
        <p className="mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-400">
          We could not confirm this payment. If you were charged, contact A.M.T Imports.
        </p>
      )}

      {list.length === 0 ? (
        <EmptyState
          title="No invoices"
          description="You don't have any invoices yet."
        />
      ) : (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="text-left px-6 py-3 font-medium text-zinc-500">Invoice #</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-zinc-500 hidden md:table-cell">Due Date</th>
                  <th className="px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {list.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">{inv.invoice_number}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                      {formatCents(inv.amount_cents, inv.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden md:table-cell">
                      {inv.due_date ? formatDate(inv.due_date) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {inv.status === "sent" || inv.status === "overdue" ? "Pay" : "View"}
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
