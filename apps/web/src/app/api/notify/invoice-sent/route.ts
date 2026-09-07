import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/email/send";
import { inviteCustomerToPortal } from "@/lib/auth/invite-customer";
import { siteUrl } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const { invoiceId } = await request.json();
    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, customer:customers(email, full_name, user_id)")
      .eq("id", invoiceId)
      .single();

    if (!invoice || !invoice.customer?.email) {
      return NextResponse.json({ error: "Invoice or customer not found" }, { status: 404 });
    }

    const origin = siteUrl();
    const payUrl = `${origin}/portal/invoices/${invoiceId}`;

    await sendInvoiceEmail({
      to: invoice.customer.email,
      customerName: invoice.customer.full_name,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount_cents,
      currency: invoice.currency,
      payUrl,
    });

    if (!invoice.customer.user_id) {
      try {
        await inviteCustomerToPortal({
          customerId: invoice.customer_id,
          email: invoice.customer.email,
          fullName: invoice.customer.full_name,
          nextPath: `/portal/invoices/${invoiceId}`,
          origin,
        });
      } catch (err) {
        console.error("Failed to invite customer for invoice:", err);
      }
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
