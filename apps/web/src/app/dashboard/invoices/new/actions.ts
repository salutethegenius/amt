"use server";

import { requireAdmin } from "@/lib/auth/require-admin";

export async function createInvoiceAction(input: {
  customerId: string;
  orderId: string;
  dueDate: string | null;
  items: { description: string; quantity: number; unit_price_cents: number }[];
}): Promise<{ id?: string; error?: string }> {
  const { supabase, ok } = await requireAdmin();
  if (!ok) {
    return { error: "Admin access required" };
  }

  const items = input.items.filter((item) => item.description.trim());
  if (!input.customerId || !input.orderId || items.length === 0) {
    return { error: "Customer, order, and at least one line item are required" };
  }

  const { data, error } = await supabase.rpc("create_invoice_with_items", {
    p_customer_id: input.customerId,
    p_due_date: input.dueDate,
    p_items: items,
    p_order_id: input.orderId,
  });

  if (error || !data) {
    console.error("create_invoice_with_items failed:", error);
    return { error: "Failed to create invoice" };
  }

  return { id: data as string };
}
