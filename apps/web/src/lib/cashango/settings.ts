import type { SupabaseClient } from "@supabase/supabase-js";

export const CNG_LAST_SYNC_KEY = "cng_last_sync_at";

export async function getLastCngSyncAt(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", CNG_LAST_SYNC_KEY)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setLastCngSyncAt(
  supabase: SupabaseClient,
  iso: string
): Promise<void> {
  const { error } = await supabase.from("app_settings").upsert({
    key: CNG_LAST_SYNC_KEY,
    value: iso,
  });
  if (error) throw error;
}
