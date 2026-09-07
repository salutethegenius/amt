import { createAdminClient } from "@/lib/supabase/admin";
import { sendPortalInvite } from "@/lib/email/send";
import { siteUrl } from "@/lib/site";

export async function inviteCustomerToPortal(opts: {
  customerId: string;
  email: string;
  fullName: string;
  nextPath?: string;
  origin?: string;
}): Promise<{ invited: boolean }> {
  const admin = createAdminClient();
  const email = opts.email.trim().toLowerCase();
  const origin = (opts.origin ?? siteUrl()).replace(/\/$/, "");
  const next = opts.nextPath && opts.nextPath.startsWith("/") ? opts.nextPath : "/portal";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  let userId: string | null = null;

  const { data: created } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: opts.fullName },
  });

  if (created?.user) {
    userId = created.user.id;
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (link?.user?.id) {
    userId = link.user.id;
  }

  if (userId) {
    await admin
      .from("customers")
      .update({ user_id: userId })
      .eq("id", opts.customerId)
      .is("user_id", null);
  }

  const actionLink = link?.properties?.action_link;
  if (actionLink) {
    await sendPortalInvite({
      to: email,
      customerName: opts.fullName,
      inviteUrl: actionLink,
    });
    return { invited: true };
  }

  if (linkError) {
    console.error("Portal invite link failed:", linkError.message);
  }

  return { invited: false };
}
