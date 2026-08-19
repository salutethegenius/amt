export const dynamic = "force-dynamic";

import Link from "next/link";
import { settleCngReturn } from "@/lib/cng-settle";

export default async function CngSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    ORDER_NUMBER?: string;
    STATUS?: string;
    PAYMENT_ID?: string;
  }>;
}) {
  const params = await searchParams;
  let result: Awaited<ReturnType<typeof settleCngReturn>> = { outcome: "error" };

  try {
    result = await settleCngReturn({
      status: params.STATUS,
      orderNumber: params.ORDER_NUMBER,
      paymentId: params.PAYMENT_ID,
    });
  } catch (error) {
    console.error("CNG success page settle error:", error);
  }

  const invoiceHref = result.invoiceId ? `/portal/invoices/${result.invoiceId}` : "/portal/invoices";
  const paid = result.outcome === "paid";

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">A.M.T Imports</p>
        <h1 className={`mt-3 text-2xl font-bold ${paid ? "text-green-700" : "text-red-700"}`}>
          {paid ? "Payment successful" : "Payment could not be confirmed"}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {paid
            ? result.invoiceNumber
              ? `Invoice ${result.invoiceNumber} is paid. You can close this window.`
              : "Your payment is confirmed. You can close this window."
            : "If you were charged, contact A.M.T Imports. You can close this window or view the invoice after signing in."}
        </p>
        <Link
          href={invoiceHref}
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View invoice
        </Link>
      </div>
    </main>
  );
}
