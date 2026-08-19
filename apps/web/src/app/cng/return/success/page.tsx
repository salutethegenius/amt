export const dynamic = "force-dynamic";

import { after } from "next/server";
import Link from "next/link";

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
  const paid = (params.STATUS || "").toUpperCase() === "PAID" && Boolean(params.ORDER_NUMBER);

  after(async () => {
    if (!params.ORDER_NUMBER) return;
    try {
      const { settleCngReturn } = await import("@/lib/cng-settle");
      await settleCngReturn({
        status: params.STATUS,
        orderNumber: params.ORDER_NUMBER,
        paymentId: params.PAYMENT_ID,
      });
    } catch (error) {
      console.error("CNG success page settle error:", error);
    }
  });

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">A.M.T Imports</p>
        <h1 className={`mt-3 text-2xl font-bold ${paid ? "text-green-700" : "text-zinc-900"}`}>
          {paid ? "Payment received" : "Payment response"}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {paid
            ? params.ORDER_NUMBER
              ? `We are confirming invoice ${params.ORDER_NUMBER}. You can close this window.`
              : "We are confirming your payment. You can close this window."
            : "If you completed payment, it may take a moment to show as paid. You can close this window."}
        </p>
        <Link
          href="/portal/invoices"
          className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to invoices
        </Link>
      </div>
    </main>
  );
}
