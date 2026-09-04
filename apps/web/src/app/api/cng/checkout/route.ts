import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CNG_MIN_AMOUNT_CENTS, makeCngOrderNumber, publicOriginFromRequest } from "@/lib/cng";
import { NextResponse } from "next/server";

const PENDING_TTL_MS = 60 * 60 * 1000;

function checkoutPayload(orderNumber: string, amountCents: number) {
  return {
    redirectPath: `/api/cng/redirect/${encodeURIComponent(orderNumber)}`,
    orderNumber,
    amountCents,
  };
}

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

    publicOriginFromRequest(request);

    const admin = createAdminClient();
    const { data: pending, error: pendingError } = await admin
      .from("checkout_sessions")
      .select("id, order_number, expected_amount_cents, created_at")
      .eq("invoice_id", invoice.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
    }

    if (pending) {
      const ageMs = Date.now() - new Date(pending.created_at).getTime();
      if (ageMs < PENDING_TTL_MS) {
        if (pending.expected_amount_cents !== invoice.amount_cents) {
          const { error: updateError } = await admin
            .from("checkout_sessions")
            .update({ expected_amount_cents: invoice.amount_cents })
            .eq("id", pending.id);
          if (updateError) {
            return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
          }
        }

        await admin
          .from("invoices")
          .update({ cng_passphrase: pending.order_number })
          .eq("id", invoice.id);

        return NextResponse.json(
          checkoutPayload(pending.order_number, invoice.amount_cents)
        );
      }

      const { error: expireError } = await admin
        .from("checkout_sessions")
        .update({ status: "expired" })
        .eq("id", pending.id)
        .eq("status", "pending");
      if (expireError) {
        return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
      }
    }

    const orderNumber = makeCngOrderNumber(invoice.invoice_number);
    const { error: sessionError } = await admin.from("checkout_sessions").insert({
      invoice_id: invoice.id,
      order_number: orderNumber,
      expected_amount_cents: invoice.amount_cents,
      status: "pending",
    });

    if (sessionError) {
      if (sessionError.code === "23505") {
        const { data: existing } = await admin
          .from("checkout_sessions")
          .select("order_number")
          .eq("invoice_id", invoice.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing) {
          return NextResponse.json(
            checkoutPayload(existing.order_number, invoice.amount_cents)
          );
        }
        return NextResponse.json(
          { error: "Checkout already in progress" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Failed to start checkout" }, { status: 500 });
    }

    await admin
      .from("invoices")
      .update({ cng_passphrase: orderNumber })
      .eq("id", invoice.id);

    return NextResponse.json(checkoutPayload(orderNumber, invoice.amount_cents));
  } catch (error) {
    console.error("CNG checkout error:", error);
    const message =
      error instanceof Error && error.message.includes("public HTTPS")
        ? error.message
        : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
