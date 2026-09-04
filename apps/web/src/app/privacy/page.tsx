import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | A.M.T Imports",
  description:
    "How A.M.T Imports collects, uses, and protects information for courier, invoicing, and customer portal services.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-800">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
        A.M.T Imports
      </p>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: September 2026</p>

      <section className="space-y-4 text-sm leading-7">
        <p>
          A.M.T Imports (&quot;we&quot;, &quot;us&quot;) provides courier and import services from Nassau, The
          Bahamas. This policy explains how we handle information when you use our website, customer portal,
          invoices, and online payments.
        </p>
        <h2 className="text-lg font-semibold pt-4">What we collect</h2>
        <p>
          We collect contact and account details (name, email, phone, address, company), shipment and order
          information, invoices, and payment records processed through Cash N&apos; Go / PayLanes. Authentication
          is handled by our hosting and database providers.
        </p>
        <h2 className="text-lg font-semibold pt-4">How we use it</h2>
        <p>
          We use this information to fulfill deliveries, issue and collect invoices, send operational email
          (invoice, payment, and order updates), and secure the admin and customer portals.
        </p>
        <h2 className="text-lg font-semibold pt-4">Payments</h2>
        <p>
          Card payments are processed by Cash N&apos; Go (PayLanes). We store payment identifiers, amounts, and
          settlement status needed to mark invoices paid. We do not store full card numbers.
        </p>
        <h2 className="text-lg font-semibold pt-4">Contact</h2>
        <p>
          Questions:{" "}
          <a className="text-blue-600" href="mailto:info@amtimports.com">
            info@amtimports.com
          </a>
          . See also our{" "}
          <Link className="text-blue-600" href="/terms">
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
