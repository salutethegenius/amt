import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPaymentPageUrl,
  CNG_MIN_AMOUNT_CENTS,
  generatePassphrase,
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

    const passphrase = generatePassphrase();
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("invoices")
      .update({ cng_passphrase: passphrase })
      .eq("id", invoice.id);

    if (updateError) {
      console.error("Failed to store CNG passphrase:", updateError);
      return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
    }

    const url = buildPaymentPageUrl({
      amountCents: invoice.amount_cents,
      orderNumber: invoice.invoice_number,
      passphrase,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("CNG checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
