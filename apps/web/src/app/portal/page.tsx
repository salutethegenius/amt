import { createClient } from "@/lib/supabase/server";
import { resolvePortalCustomerId } from "@/lib/auth/resolve-customer";
import { PortalAccountPending } from "@/app/portal/account-pending";
import { StatCard } from "@/components/ui/card";
import { OrderStatusBadge, InvoiceStatusBadge } from "@/components/ui/badge";
import { formatCents, formatDate } from "@/lib/types";
import type { Order, Invoice } from "@/lib/types";
import Link from "next/link";

export default async function PortalDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await resolvePortalCustomerId(user);

  if (!customerId) {
    return <PortalAccountPending title="Welcome" />;
  }

  const [ordersRes, invoicesRes, recentOrdersRes, recentInvoicesRes] = await Promise.all([
    supabase.from("orders").select("id, status").eq("customer_id", customerId),
    supabase.from("invoices").select("id, status, amount_cents").eq("customer_id", customerId),
    supabase
      .from("orders")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const orders = ordersRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const activeOrders = orders.filter((o) => o.status !== "completed").length;
  const unpaidInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const unpaidTotal = unpaidInvoices.reduce((sum, i) => sum + i.amount_cents, 0);
  const recentOrders = (recentOrdersRes.data ?? []) as Order[];
  const recentInvoices = (recentInvoicesRes.data ?? []) as Invoice[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">My Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Active Orders" value={activeOrders} />
        <StatCard label="Total Orders" value={orders.length} />
        <StatCard label="Unpaid Invoices" value={unpaidInvoices.length} />
        <StatCard label="Amount Due" value={formatCents(unpaidTotal)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Orders</h2>
            <Link href="/portal/orders" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentOrders.length === 0 && (
              <p className="px-6 py-8 text-sm text-zinc-500 text-center">No orders yet.</p>
            )}
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/portal/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {order.description || "Delivery Order"}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Invoices</h2>
            <Link href="/portal/invoices" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentInvoices.length === 0 && (
              <p className="px-6 py-8 text-sm text-zinc-500 text-center">No invoices yet.</p>
            )}
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/portal/invoices/${invoice.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {invoice.invoice_number}
                  </p>
                  <p className="text-xs text-zinc-500">{formatCents(invoice.amount_cents)}</p>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
