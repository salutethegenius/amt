export const dynamic = "force-dynamic";

import Link from "next/link";

export default function CngCancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">A.M.T Imports</p>
        <h1 className="mt-3 text-2xl font-bold text-zinc-900">Payment cancelled</h1>
        <p className="mt-3 text-sm text-zinc-600">
          No charge was made. You can close this window or try again from your invoice.
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
