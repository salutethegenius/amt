import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPaymentPageUrl, publicOriginFromRequest } from "@/lib/cng";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber: raw } = await context.params;
  const orderNumber = decodeURIComponent(raw);
  const origin = publicOriginFromRequest(request);
  const admin = createAdminClient();

  const { data: session, error } = await admin
    .from("checkout_sessions")
    .select("id, status, expected_amount_cents, order_number")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !session) {
    return NextResponse.redirect(new URL("/cng/return/error?reason=unknown_order", `${origin}/`));
  }

  if (session.status === "completed") {
    return NextResponse.redirect(
      new URL(
        `/cng/return/success?ORDER_NUMBER=${encodeURIComponent(orderNumber)}&STATUS=PAID`,
        `${origin}/`
      )
    );
  }

  const paymentUrl = buildPaymentPageUrl({
    amountCents: session.expected_amount_cents,
    orderNumber: session.order_number,
    siteUrl: origin,
  });

  return NextResponse.redirect(paymentUrl, 302);
}
