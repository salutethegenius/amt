"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, publicSiteUrl } from "@/lib/auth/require-admin";
import { sendPortalInvite } from "@/lib/email/send";

function genericError(): { success: false; error: string } {
  return { success: false, error: "Something went wrong. Try again." };
}

async function linkCustomer(customerId: string, userId: string, email: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("customers")
    .update({ user_id: userId, email })
    .eq("id", customerId);
  if (error) return genericError();
  return { success: true as const, linkedEmail: email };
}

export async function inviteAndLink(
  customerId: string,
  email: string
): Promise<{ success: boolean; error?: string; linkedEmail?: string }> {
  const adminGate = await requireAdmin();
  if (!adminGate.ok) {
    return { success: false, error: "Admin access required" };
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: "Email is required" };
  }

  const admin = createAdminClient();
  const origin = publicSiteUrl();
  const redirectTo = `${origin}/auth/callback?next=/portal`;

  const { data: customer } = await adminGate.supabase
    .from("customers")
    .select("id, full_name, email")
    .eq("id", customerId)
    .single();
  if (!customer) {
    return { success: false, error: "Customer not found" };
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalized,
    { redirectTo }
  );

  if (!inviteError && invited.user) {
    const linked = await linkCustomer(customerId, invited.user.id, normalized);
    if (!linked.success) return linked;
    return { success: true, linkedEmail: normalized };
  }

  const { data: existingLink, error: existingError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
    options: { redirectTo },
  });

  const existingUser = existingLink?.user;
  if (existingError || !existingUser) {
    return {
      success: false,
      error: "Could not invite or find that email. Ask the customer to sign up, then try again.",
    };
  }

  const linked = await linkCustomer(customerId, existingUser.id, normalized);
  if (!linked.success) return linked;

  const actionLink = existingLink.properties?.action_link;
  if (actionLink) {
    try {
      await sendPortalInvite({
        to: normalized,
        customerName: customer.full_name,
        inviteUrl: actionLink,
      });
    } catch (err) {
      console.error("Failed to send portal invite email:", err);
    }
  }

  return { success: true, linkedEmail: normalized };
}

export async function linkByEmail(customerId: string, email: string) {
  return inviteAndLink(customerId, email);
}

export async function linkToUser(customerId: string, email: string) {
  return inviteAndLink(customerId, email);
}

export async function unlinkAccount(
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  const adminGate = await requireAdmin();
  if (!adminGate.ok) {
    return { success: false, error: "Admin access required" };
  }

  const { error } = await adminGate.supabase
    .from("customers")
    .update({ user_id: null })
    .eq("id", customerId);

  if (error) {
    return genericError();
  }

  return { success: true };
}
