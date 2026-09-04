import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Customer } from "@/lib/types";

export default async function NewOrderPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name")
    .order("full_name");

  const list = (customers ?? []) as Pick<Customer, "id" | "full_name">[];

  async function createOrder(formData: FormData) {
    "use server";
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    const { supabase, ok } = await requireAdmin();
    if (!ok) throw new Error("Admin access required");

    const { error } = await supabase.from("orders").insert({
      customer_id: formData.get("customer_id") as string,
      description: (formData.get("description") as string) || null,
      pickup_address: (formData.get("pickup_address") as string) || null,
      delivery_address: (formData.get("delivery_address") as string) || null,
    });

    if (error) {
      console.error("Failed to create order:", error);
      throw new Error("Failed to create order");
    }
    redirect("/dashboard/orders");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Orders
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">New Order</h1>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">You need to create a customer first.</p>
          <Link href="/dashboard/customers/new" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
            Add Customer
          </Link>
        </div>
      ) : (
        <form action={createOrder} className="space-y-6">
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Customer *
            </label>
            <select
              id="customer_id"
              name="customer_id"
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select customer...</option>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Package details, special instructions..."
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pickup_address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Pickup Address
              </label>
              <textarea
                id="pickup_address"
                name="pickup_address"
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="delivery_address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Delivery Address
              </label>
              <textarea
                id="delivery_address"
                name="delivery_address"
                rows={2}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Order
            </button>
            <Link
              href="/dashboard/orders"
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
