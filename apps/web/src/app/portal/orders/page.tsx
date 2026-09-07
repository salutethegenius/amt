import { createClient } from "@/lib/supabase/server";
import { resolvePortalCustomerId } from "@/lib/auth/resolve-customer";
import { PortalAccountPending } from "@/app/portal/account-pending";
import { OrderStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/types";
import type { Order } from "@/lib/types";
import Link from "next/link";

export default async function PortalOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const customerId = await resolvePortalCustomerId(user);

  if (!customerId) {
    return <PortalAccountPending title="My Orders" />;
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const list = (orders ?? []) as Order[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">My Orders</h1>

      {list.length === 0 ? (
        <EmptyState
          title="No orders"
          description="You don't have any orders yet."
        />
      ) : (
        <div className="space-y-4">
          {list.map((order) => (
            <Link
              key={order.id}
              href={`/portal/orders/${order.id}`}
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {order.description || "Delivery Order"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(order.created_at)}</p>
                  {order.delivery_address && (
                    <p className="text-xs text-zinc-500 mt-1">To: {order.delivery_address}</p>
                  )}
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
