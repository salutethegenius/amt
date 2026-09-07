import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export async function resolvePortalCustomerId(user: User | null): Promise<string | null> {
  if (!user) return null;

  const admin = createAdminClient();
  const email = user.email?.trim().toLowerCase() ?? "";

  const { data: byUser } = await admin
    .from("customers")
    .select("id, email")
    .eq("user_id", user.id);

  if (byUser && byUser.length === 1) return byUser[0].id;
  if (byUser && byUser.length > 1) {
    const match = byUser.find((row) => row.email?.toLowerCase() === email);
    return (match ?? byUser[0]).id;
  }

  if (!email) return null;

  const { data: byEmail } = await admin
    .from("customers")
    .select("id, email, user_id, created_at")
    .ilike("email", email)
    .order("created_at", { ascending: true });

  const candidates = (byEmail ?? []).filter((row) => !row.user_id || row.user_id === user.id);
  const chosen = candidates[0];
  if (!chosen) return null;

  if (!chosen.user_id) {
    await admin
      .from("customers")
      .update({ user_id: user.id })
      .eq("id", chosen.id)
      .is("user_id", null);
  }

  return chosen.id;
}
