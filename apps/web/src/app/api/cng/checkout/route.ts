import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CNG_MIN_AMOUNT_CENTS,
  makeCngOrderNumber,
  publicOriginFromRequest,
} from "@/lib/cng";
import { NextResponse } from "next/server";

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

    const { data: customerRecord } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!customerRecord) {
      return NextResponse.json({ error: "Customer not found" }, { status: 403 });
    }

    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, invoice_number, amount_cents, status, customer_id")
      .eq("id", invoiceId)
      .eq("customer_id", customerRecord.id)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }

    if (invoice.status !== "sent" && invoice.status !== "overdue") {
      return NextResponse.json({ error: "Invoice is not payable yet" }, { status: 400 });
    }

    if (invoice.amount_cents < CNG_MIN_AMOUNT_CENTS) {
      return NextResponse.json(
        { error: "Cash N' Go requires an amount greater than $1.00" },
        { status: 400 }
      );
    }

    const origin = publicOriginFromRequest(request);
    const orderNumber = makeCngOrderNumber(invoice.invoice_number);

    try {
      const { error } = await createAdminClient()
        .from("invoices")
        .update({ cng_passphrase: orderNumber })
        .eq("id", invoice.id);
      if (error) {
        console.error("CNG checkout: failed to store order number", error);
      }
    } catch (error) {
      console.error("CNG checkout: failed to store order number", error);
    }

    console.info("CNG checkout started", {
      invoice: invoice.invoice_number,
      origin,
    });

    return NextResponse.json({
      redirectPath: `/api/cng/redirect/${encodeURIComponent(orderNumber)}`,
      debug: {
        origin,
        success: `${origin}/cng/return/success`,
        cancel: `${origin}/cng/return/cancel`,
      },
    });
  } catch (error) {
    console.error("CNG checkout error:", error);
    const message =
      error instanceof Error && error.message.includes("public HTTPS")
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
