import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Customer } from "@/lib/types";
import { AccountLinkSection } from "./account-link-section";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) notFound();
  const c = customer as Customer;

  let linkedEmail: string | null = null;
  if (c.user_id) {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(c.user_id);
    linkedEmail = data?.user?.email ?? null;
  }

  async function updateCustomer(formData: FormData) {
    "use server";
    const { requireAdmin } = await import("@/lib/auth/require-admin");
    const { supabase, ok } = await requireAdmin();
    if (!ok) throw new Error("Admin access required");

    const { error } = await supabase
      .from("customers")
      .update({
        full_name: formData.get("full_name") as string,
        email: formData.get("email") as string,
        company_name: (formData.get("company_name") as string) || null,
        phone: (formData.get("phone") as string) || null,
        address: (formData.get("address") as string) || null,
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update customer:", error);
      throw new Error("Failed to update customer");
    }
    redirect("/dashboard/customers");
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/customers" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          &larr; Back to Customers
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Edit Customer</h1>
      </div>

      <form action={updateCustomer} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={c.full_name}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={c.email}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Company Name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              defaultValue={c.company_name ?? ""}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={c.phone ?? ""}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            defaultValue={c.address ?? ""}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
          <Link
            href="/dashboard/customers"
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-6 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>

      <AccountLinkSection
        customerId={c.id}
        customerEmail={c.email}
        linkedUserId={c.user_id}
        linkedEmail={linkedEmail}
      />
    </div>
  );
}
