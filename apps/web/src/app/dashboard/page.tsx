import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/card";
import { OrderStatusBadge, InvoiceStatusBadge } from "@/components/ui/badge";
import { todaysPaymentTotals } from "@/lib/analytics";
import { formatCents, formatDate } from "@/lib/types";
import type { Order, Invoice } from "@/lib/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [customersRes, ordersRes, invoicesRes, paymentsRes, recentOrdersRes, recentInvoicesRes] =
    await Promise.all([
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("invoices").select("id, status", { count: "exact" }),
      supabase
        .from("invoice_payments")
        .select("amount_cents, net_cents, fee_cents, created_at, cng_created_at, status")
        .eq("status", "completed"),
      supabase
        .from("orders")
        .select("*, customer:customers(*)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("invoices")
        .select("*, customer:customers(*)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const loadError =
    customersRes.error ||
    ordersRes.error ||
    invoicesRes.error ||
    paymentsRes.error ||
    recentOrdersRes.error ||
    recentInvoicesRes.error;

  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">Dashboard</h1>
        <p className="text-sm text-red-700">Could not load dashboard data. Try again shortly.</p>
      </div>
    );
  }

  const totalCustomers = customersRes.count ?? 0;
  const totalOrders = ordersRes.count ?? 0;
  const unpaidInvoices = (invoicesRes.data ?? []).filter(
    (i) => i.status === "sent" || i.status === "overdue"
  ).length;
  const totalRevenue = (paymentsRes.data ?? []).reduce(
    (sum, p) => sum + (p.net_cents ?? p.amount_cents),
    0
  );
  const today = todaysPaymentTotals(paymentsRes.data ?? []);
  const recentOrders = (recentOrdersRes.data ?? []) as (Order & { customer: { full_name: string } })[];
  const recentInvoices = (recentInvoicesRes.data ?? []) as (Invoice & { customer: { full_name: string } })[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Customers" value={totalCustomers} />
        <StatCard label="Total Orders" value={totalOrders} />
        <StatCard label="Unpaid Invoices" value={unpaidInvoices} />
        <StatCard label="Total Revenue" value={formatCents(totalRevenue)} />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatCard label="Today's Revenue" value={formatCents(today.revenueCents)} />
        <StatCard label="Today's Fees" value={formatCents(today.feesCents)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-xs font-medium text-blue-600 hover:text-blue-700">
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
                href={`/dashboard/orders`}
                className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {order.customer?.full_name}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(order.created_at)}</p>
                </div>
                <OrderStatusBadge status={order.status} />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Invoices</h2>
            <Link href="/dashboard/invoices" className="text-xs font-medium text-blue-600 hover:text-blue-700">
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
                href={`/dashboard/invoices/${invoice.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {invoice.invoice_number} &mdash; {invoice.customer?.full_name}
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
