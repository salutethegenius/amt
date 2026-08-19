import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildPaymentPageUrl,
  invoiceNumberFromCngOrderNumber,
  publicOriginFromRequest,
} from "@/lib/cng";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber: raw } = await context.params;
  const orderNumber = decodeURIComponent(raw);
  const origin = publicOriginFromRequest(request);
  const admin = createAdminClient();

  const { data: byAttempt } = await admin
    .from("invoices")
    .select("id, invoice_number, amount_cents, status, cng_passphrase")
    .eq("cng_passphrase", orderNumber)
    .maybeSingle();

  const invoice =
    byAttempt ??
    (
      await admin
        .from("invoices")
        .select("id, invoice_number, amount_cents, status, cng_passphrase")
        .eq("invoice_number", invoiceNumberFromCngOrderNumber(orderNumber))
        .maybeSingle()
    ).data;

  if (!invoice) {
    return NextResponse.redirect(new URL("/cng/return/cancel", `${origin}/`));
  }

  if (invoice.status === "paid") {
    return NextResponse.redirect(new URL("/cng/return/success?STATUS=PAID", `${origin}/`));
  }

  const paymentUrl = buildPaymentPageUrl({
    amountCents: invoice.amount_cents,
    orderNumber: invoice.cng_passphrase || orderNumber,
    siteUrl: origin,
  });

  return NextResponse.redirect(paymentUrl, 302);
}
