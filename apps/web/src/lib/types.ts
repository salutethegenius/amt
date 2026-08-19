export type Role = "admin" | "customer";

export interface Profile {
  id: string;
  role: Role;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone: string | null;
  address: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "processing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "completed";

export interface Order {
  id: string;
  customer_id: string;
  description: string | null;
  status: OrderStatus;
  pickup_address: string | null;
  delivery_address: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled";

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  order_id: string | null;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string | null;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  cng_passphrase: string | null;
  cng_payment_id: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order?: Order;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentProvider = "cng" | "manual" | "stripe";

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  provider: PaymentProvider | null;
  cng_payment_id: string | null;
  payment_platform: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  invoice?: Invoice;
}

export function paymentMethodLabel(payment: InvoicePayment): string {
  if (payment.provider === "cng" || payment.cng_payment_id) {
    return payment.payment_platform
      ? `Cash N' Go (${payment.payment_platform})`
      : "Cash N' Go";
  }
  if (payment.provider === "stripe" || payment.stripe_payment_intent_id) {
    return "Stripe";
  }
  return "Manual";
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  processing: "Processing",
  ready_for_pickup: "Ready for Pickup",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
