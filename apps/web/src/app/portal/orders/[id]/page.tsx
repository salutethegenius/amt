import { createClient } from "@/lib/supabase/server";
import { resolvePortalCustomerId } from "@/lib/auth/resolve-customer";
import { PortalAccountPending } from "@/app/portal/account-pending";
import { notFound } from "next/navigation";
import { formatCents, formatDate } from "@/lib/types";
import type { Invoice, Order, OrderStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS } from "@/lib/types";
import Link from "next/link";
import { PayButton } from "@/app/portal/invoices/[id]/pay-button";
import { InvoiceStatusBadge } from "@/components/ui/badge";

const statusSteps: OrderStatus[] = [
  "processing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
];

function getStepIndex(status: OrderStatus): number {
  return statusSteps.indexOf(status);
}

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await resolvePortalCustomerId(user);
  if (!customerId) {
    return <PortalAccountPending title="Order" />;
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("customer_id", customerId)
    .single();

  if (!order) notFound();

  const o = order as Order;
  const currentStep = getStepIndex(o.status);

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("order_id", o.id)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const linkedInvoices = (invoices ?? []) as Invoice[];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href="/portal/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Orders
        </Link>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">
            {o.description || "Delivery Order"}
          </h1>
          <p className="text-sm text-zinc-500">
            Created {formatDate(o.created_at)} &middot; Last updated {formatDate(o.updated_at)}
          </p>
        </div>

        {/* Status Timeline */}
        <div className="px-6 py-8">
          <div className="relative">
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex items-start gap-4 relative">
                  {/* Connector line */}
                  {idx < statusSteps.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-8 w-0.5 h-10 ${
                        idx < currentStep
                          ? "bg-blue-600"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    />
                  )}
                  {/* Dot */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCurrent
                        ? "bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/50"
                        : isCompleted
                        ? "bg-blue-600"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                    )}
                  </div>
                  {/* Label */}
                  <div className={`pb-10 ${isCurrent ? "" : ""}`}>
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-zinc-900 dark:text-white"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {ORDER_STATUS_LABELS[step]}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Current status</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details */}
        {(o.pickup_address || o.delivery_address) && (
          <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 grid sm:grid-cols-2 gap-6">
            {o.pickup_address && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Pickup</p>
                <p className="text-sm text-zinc-900 dark:text-white">{o.pickup_address}</p>
              </div>
            )}
            {o.delivery_address && (
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Delivery</p>
                <p className="text-sm text-zinc-900 dark:text-white">{o.delivery_address}</p>
              </div>
            )}
          </div>
        )}

        {linkedInvoices.length > 0 && (
          <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Invoice</p>
            {linkedInvoices.map((inv) => {
              const canPay = inv.status === "sent" || inv.status === "overdue";
              return (
                <div
                  key={inv.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/portal/invoices/${inv.id}`}
                        className="text-sm font-medium text-zinc-900 dark:text-white hover:text-blue-600"
                      >
                        {inv.invoice_number}
                      </Link>
                      <InvoiceStatusBadge status={inv.status} />
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {formatCents(inv.amount_cents, inv.currency)}
                    </p>
                  </div>
                  {canPay && <PayButton invoiceId={inv.id} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
