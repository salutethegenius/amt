"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Customer, Order } from "@/lib/types";
import { createInvoiceAction } from "./actions";

interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export default function NewInvoicePage() {
  const [customers, setCustomers] = useState<Pick<Customer, "id" | "full_name">[]>([]);
  const [orders, setOrders] = useState<Pick<Order, "id" | "description" | "created_at">[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price_cents: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("customers")
      .select("id, full_name")
      .order("full_name")
      .then(({ data }) => setCustomers(data ?? []));
  }, []);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("orders")
      .select("id, description, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setOrders(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unit_price_cents: 0 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price_cents, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !orderId || items.length === 0) return;
    setLoading(true);

    const result = await createInvoiceAction({
      customerId,
      orderId,
      dueDate: dueDate || null,
      items: items.filter((item) => item.description.trim()),
    });

    if (!result.id) {
      setLoading(false);
      alert(result.error || "Failed to create invoice");
      return;
    }

    router.push(`/dashboard/invoices/${result.id}`);
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Invoices
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Customer *
            </label>
            <select
              id="customer_id"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                setOrderId("");
                setOrders([]);
              }}
              required
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="order_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Order *
            </label>
            <select
              id="order_id"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
              disabled={!customerId}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">
                {!customerId
                  ? "Select a customer first..."
                  : orders.length === 0
                    ? "No orders for this customer"
                    : "Select order..."}
              </option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.description || "Delivery Order"} — {new Date(order.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
            {customerId && orders.length === 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                Create an order for this customer before invoicing.{" "}
                <Link href="/dashboard/orders/new" className="text-blue-600 hover:text-blue-700">
                  New order
                </Link>
              </p>
            )}
          </div>
          <div>
            <label htmlFor="due_date" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Due Date
            </label>
            <input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-6">
                  {idx === 0 && <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>}
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Service or item..."
                    required
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  {idx === 0 && <label className="block text-xs font-medium text-zinc-500 mb-1">Qty</label>}
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-3">
                  {idx === 0 && <label className="block text-xs font-medium text-zinc-500 mb-1">Unit Price ($)</label>}
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={(item.unit_price_cents / 100).toFixed(2)}
                    onChange={(e) => updateItem(idx, "unit_price_cents", Math.round(parseFloat(e.target.value || "0") * 100))}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className={`p-2 text-zinc-400 hover:text-red-500 transition-colors ${idx === 0 ? "mt-5" : ""}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <span className="text-sm text-zinc-500">Total: </span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              ${(total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !orderId}
            className="rounded-lg bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Invoice"}
          </button>
          <Link
            href="/dashboard/invoices"
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
