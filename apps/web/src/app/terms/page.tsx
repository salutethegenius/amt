import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | A.M.T Imports",
  description: "Terms for using A.M.T Imports courier services, customer portal, invoicing, and online payments.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
        A.M.T Imports
      </p>
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: September 2026</p>

      <section className="space-y-4 text-sm leading-7">
        <p>
          These terms govern use of A.M.T Imports websites, the customer portal, invoices, and online payments.
          By signing in or paying an invoice you agree to them.
        </p>
        <h2 className="text-lg font-semibold pt-4">Accounts</h2>
        <p>
          Portal accounts are for the named customer. Keep your login confidential. We may link a portal user to
          a customer record so you can see only your orders and invoices.
        </p>
        <h2 className="text-lg font-semibold pt-4">Payments</h2>
        <p>
          Online payments are collected via Cash N&apos; Go. A payment is complete when our system records a
          successful settlement from Cash N&apos; Go (webhook or transaction sync), not merely when you return
          from the payment page.
        </p>
        <h2 className="text-lg font-semibold pt-4">Contact</h2>
        <p>
          <a className="text-blue-600" href="mailto:info@amtimports.com">
            info@amtimports.com
          </a>
          . Privacy details are in our{" "}
          <Link className="text-blue-600" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
